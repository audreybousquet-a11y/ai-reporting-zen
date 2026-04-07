"""
mcd.py — Phase 1 : génération MCD depuis Excel
"""

import os
import re
from datetime import datetime

import pandas as pd
import streamlit as st

from persistence import sauvegarder_mcd


def detecter_type_sql(serie: pd.Series, nom: str) -> str:
    non_null = serie.dropna()
    nom_lower = nom.lower()
    if any(k in nom_lower for k in ["date", "datetime", "created_at", "updated_at"]):
        parsed = pd.to_datetime(non_null, errors="coerce")
        if parsed.notna().mean() > 0.7:
            if hasattr(parsed.dt, "time") and (parsed.dt.hour > 0).any():
                return "DATETIME"
            return "DATE"
    if any(k in nom_lower for k in ["time", "heure", "start", "end", "debut", "fin"]):
        # Ne pas tenter pd.to_datetime sur des colonnes numériques (entiers = minutes/secondes, pas des timestamps)
        if str(serie.dtype) not in ("int64", "int32", "int16", "float64", "float32"):
            parsed = pd.to_datetime(non_null, errors="coerce")
            if parsed.notna().mean() > 0.5:
                return "DATETIME"
            if non_null.astype(str).str.match(r"^\d{1,2}:\d{2}").any():
                return "TIME"
    if str(serie.dtype) in ("int64", "int32", "int16"):
        return "INTEGER"
    if str(serie.dtype) in ("float64", "float32"):
        return "FLOAT"
    if str(serie.dtype) == "object":
        # Ne jamais traiter les colonnes téléphone/email comme numériques
        if any(k in nom_lower for k in ["phone", "tel", "mobile", "email", "mail", "zip", "postal", "name", "label", "title", "nom", "prenom", "adresse", "address", "street", "city", "ville"]):
            return "VARCHAR"
        else:
            numeric_try = pd.to_numeric(
                non_null.astype(str).str.replace(",", ".", regex=False).str.replace(" ", "", regex=False),
                errors="coerce"
            )
            ratio = numeric_try.notna().mean()
            if ratio > 0.85:
                if (numeric_try.dropna() % 1 == 0).all():
                    return "INTEGER"
                return "FLOAT"
            max_len = non_null.astype(str).str.len().max() if len(non_null) > 0 else 0
            return "VARCHAR" if max_len <= 255 else "TEXT"
    if str(serie.dtype) == "object":
        max_len = non_null.astype(str).str.len().max() if len(non_null) > 0 else 0
        if max_len <= 255:
            return "VARCHAR"
        return "TEXT"
    return "VARCHAR"


def detecter_pk(df: pd.DataFrame, table_id: str) -> str | None:
    for col in df.columns:
        col_low = col.lower()
        if col_low == "id":
            return col
        if col_low == f"{table_id}_id" or col_low == f"{table_id[:-1]}_id":
            return col
    for col in df.columns:
        if col.lower().endswith("_id") and not col.lower().startswith(("client", "employee", "work", "site")):
            if df[col].nunique() == len(df):
                return col
    return None


def detecter_fks(df: pd.DataFrame, tables_connues: dict) -> list[dict]:
    fks = []
    for col in df.columns:
        col_low = col.lower()
        if col_low.endswith("_id") and col_low != "id":
            ref = col_low[:-3]
            cible = None
            for table_key in tables_connues:
                if table_key == ref or table_key == ref + "s" or table_key.rstrip("s") == ref:
                    cible = table_key
                    break
            if cible:
                fks.append({"colonne": col, "table_cible": cible, "colonne_cible": "id"})
    return fks


def analyser_colonne_mcd(serie: pd.Series, nom: str, type_sql: str) -> dict:
    non_null = serie.dropna()
    info = {
        "type_sql": type_sql,
        "nullable": bool(serie.isna().any()),
        "unique": bool(serie.nunique() == len(serie)),
        "nb_vides": int(serie.isna().sum()),
    }
    if type_sql in ("INTEGER", "FLOAT"):
        try:
            nums = pd.to_numeric(
                non_null.astype(str).str.replace(",", ".", regex=False), errors="coerce"
            ).dropna()
            info["min"] = round(float(nums.min()), 4) if len(nums) > 0 else None
            info["max"] = round(float(nums.max()), 4) if len(nums) > 0 else None
            info["moyenne"] = round(float(nums.mean()), 4) if len(nums) > 0 else None
        except Exception:
            info["min"] = info["max"] = info["moyenne"] = None
    elif type_sql in ("DATE", "DATETIME", "TIME"):
        vals = pd.to_datetime(non_null, errors="coerce").dropna().sort_values()
        info["min"] = str(vals.iloc[0]) if len(vals) > 0 else None
        info["max"] = str(vals.iloc[-1]) if len(vals) > 0 else None
    elif type_sql == "VARCHAR":
        uniq = non_null.astype(str).unique()
        info["nb_valeurs_uniques"] = int(len(uniq))
        if len(uniq) <= 50:
            info["valeurs"] = sorted(uniq.tolist())
        else:
            info["exemples"] = non_null.astype(str).head(5).tolist()
    elif type_sql == "TEXT":
        info["nb_valeurs_uniques"] = int(non_null.nunique())
        info["exemples"] = non_null.astype(str).head(3).tolist()
    return info


@st.cache_data(show_spinner=False)
def _lire_excel(fichier_path: str, mtime: float) -> dict:
    """Lecture unique du fichier Excel, mise en cache par chemin + date de modification."""
    return pd.read_excel(fichier_path, sheet_name=None)


def generer_mcd_depuis_excel(fichier_path: str, source_label: str) -> tuple[dict, dict]:
    mtime = os.path.getmtime(fichier_path)
    all_sheets = _lire_excel(fichier_path, mtime)
    tables = {}
    schema = {}
    labels = {}
    for sheet_name, df in all_sheets.items():
        if df.empty or len(df.columns) < 2:
            continue
        df.columns = [str(c).strip() for c in df.columns]
        df = df.dropna(how="all")
        table_id = (
            sheet_name.lower()
            .replace(" ", "_")
            .replace("é", "e").replace("è", "e").replace("ê", "e")
            .replace("à", "a").replace("â", "a")
            .replace("ô", "o").replace("ù", "u").replace("û", "u")
            .replace("ç", "c")
        )
        tables[table_id] = df
        labels[table_id] = sheet_name

    for table_id, df in tables.items():
        schema[table_id] = {}
        for col in df.columns:
            type_sql = detecter_type_sql(df[col], col)
            schema[table_id][col] = analyser_colonne_mcd(df[col], col, type_sql)

    pks = {}
    fks_par_table = {}
    for table_id, df in tables.items():
        pks[table_id] = detecter_pk(df, table_id)
        fks_par_table[table_id] = detecter_fks(df, tables)

    tables_mcd = []
    for table_id, df in tables.items():
        colonnes = []
        for col, meta in schema[table_id].items():
            col_def = {"nom": col, **meta, "pk": col == pks.get(table_id), "fk": None}
            for fk in fks_par_table.get(table_id, []):
                if fk["colonne"] == col:
                    col_def["fk"] = {"table": fk["table_cible"], "colonne": fk["colonne_cible"]}
            colonnes.append(col_def)
        tables_mcd.append({
            "id": table_id,
            "label": labels.get(table_id, table_id),
            "nb_lignes": len(df),
            "pk": pks.get(table_id),
            "colonnes": colonnes,
            "fks": fks_par_table.get(table_id, [])
        })

    relations = []
    for table in tables_mcd:
        for fk in table["fks"]:
            relations.append({
                "de": table["id"], "colonne": fk["colonne"],
                "vers": fk["table_cible"], "vers_colonne": fk["colonne_cible"]
            })

    mcd = {
        "source_label": source_label,
        "source_file_path": fichier_path,
        "generated_at": datetime.now().isoformat(),
        "nb_tables": len(tables_mcd),
        "tables": tables_mcd,
        "relations": relations
    }
    sauvegarder_mcd(source_label, mcd)
    return mcd, tables
