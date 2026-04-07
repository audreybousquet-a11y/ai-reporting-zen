"""
db.py — Phase 2 : SQLite, fonctions custom, executer_sql
"""

import sqlite3
import re
from datetime import datetime

import pandas as pd


def normaliser_colonne_pour_sqlite(serie: pd.Series, type_sql: str) -> pd.Series:
    if type_sql in ("DATE", "DATETIME"):
        parsed = pd.to_datetime(serie, errors="coerce")
        if type_sql == "DATE":
            return parsed.dt.strftime("%Y-%m-%d").where(parsed.notna(), None)
        else:
            return parsed.dt.strftime("%Y-%m-%d %H:%M:%S").where(parsed.notna(), None)
    elif type_sql == "TIME":
        def fmt_time(v):
            if pd.isna(v): return None
            s = str(v).strip()
            if re.match(r"^\d{1,2}:\d{2}", s): return s
            try: return pd.to_datetime(s).strftime("%H:%M:%S")
            except: return None
        return serie.map(fmt_time)
    elif type_sql == "INTEGER":
        return pd.to_numeric(serie, errors="coerce").astype("Int64")
    elif type_sql == "FLOAT":
        return pd.to_numeric(serie.astype(str).str.replace(",", ".", regex=False), errors="coerce")
    return serie


def _enregistrer_fonctions_custom(conn: sqlite3.Connection) -> None:
    """Enregistre toutes les fonctions custom SQLite sur une connexion."""
    def _year(d):
        if not d: return None
        if str(d).lower().strip() == 'now': return datetime.now().year
        return int(str(d)[:4])

    def _month(d):
        if not d: return None
        if str(d).lower().strip() == 'now': return datetime.now().month
        return int(str(d)[5:7]) if len(str(d)) >= 7 else None

    conn.create_function("YEAR", 1, _year)
    conn.create_function("MONTH", 1, _month)
    conn.create_function("DAY", 1, lambda d: int(d[8:10]) if d and len(d) >= 10 else None)
    conn.create_function("WEEK", 1, lambda d: datetime.strptime(d[:10], "%Y-%m-%d").isocalendar()[1] if d else None)

    def _time_diff_hours(a, b):
        if not a or not b:
            return None
        sa, sb = str(a).strip(), str(b).strip()
        try:
            if len(sa) <= 8:
                def hms(s):
                    parts = s.split(":")
                    return int(parts[0]) * 3600 + int(parts[1]) * 60 + float(parts[2] if len(parts) > 2 else 0)
                return (hms(sb) - hms(sa)) / 3600
            else:
                return (datetime.strptime(sb[:19], "%Y-%m-%d %H:%M:%S") - datetime.strptime(sa[:19], "%Y-%m-%d %H:%M:%S")).total_seconds() / 3600
        except Exception:
            return None
    conn.create_function("TIME_DIFF_HOURS", 2, _time_diff_hours)

    def _duration_hours(val):
        if not val:
            return None
        s = str(val).strip()
        try:
            if len(s) <= 8 and ":" in s:
                parts = s.split(":")
                return int(parts[0]) * 1 + int(parts[1]) / 60 + (float(parts[2]) / 3600 if len(parts) > 2 else 0)
            if " " in s:
                t = s.split(" ")[1]
                parts = t.split(":")
                return int(parts[0]) + int(parts[1]) / 60 + (float(parts[2]) / 3600 if len(parts) > 2 else 0)
            return float(s) / 3600
        except Exception:
            return None
    conn.create_function("DURATION_HOURS", 1, _duration_hours)

    def _date_diff_days(start, end):
        if not start or not end:
            return None
        try:
            d1 = datetime.strptime(str(start)[:10], "%Y-%m-%d")
            d2 = datetime.strptime(str(end)[:10], "%Y-%m-%d")
            return (d2 - d1).days + 1
        except Exception:
            return None
    conn.create_function("DATE_DIFF_DAYS", 2, _date_diff_days)


def creer_sqlite_en_memoire(tables: dict, mcd: dict) -> sqlite3.Connection:
    conn = sqlite3.connect(":memory:", check_same_thread=False)
    conn.execute("PRAGMA journal_mode=WAL")
    schema_index = {}
    for t in mcd["tables"]:
        schema_index[t["id"]] = {c["nom"]: c["type_sql"] for c in t["colonnes"]}
    for table_id, df in tables.items():
        df_norm = df.copy()
        type_map = schema_index.get(table_id, {})
        for col in df_norm.columns:
            df_norm[col] = normaliser_colonne_pour_sqlite(df_norm[col], type_map.get(col, "TEXT"))
        df_norm.to_sql(table_id, conn, if_exists="replace", index=False)
    _enregistrer_fonctions_custom(conn)
    return conn


def _renommer_ctes_en_conflit(sql: str, conn: sqlite3.Connection) -> str:
    """Renomme les CTEs dont le nom entre en conflit avec une table existante.
    Ne renomme PAS les références à la vraie table à l'intérieur des corps de CTEs."""
    tables_existantes = {
        row[0].lower()
        for row in conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
    }

    cte_decl_pattern = re.compile(r'((?:WITH|,)\s+)(\w+)(\s+AS\s*\()', re.IGNORECASE)

    # Identifier les CTEs en conflit et les plages de leurs corps (entre parenthèses)
    conflits = set()
    cte_body_ranges = []
    for m in cte_decl_pattern.finditer(sql):
        nom = m.group(2)
        if nom.lower() in tables_existantes:
            conflits.add(nom)
        # Trouver la parenthèse fermante correspondante
        depth, pos = 1, m.end()
        while pos < len(sql) and depth > 0:
            if sql[pos] == '(':
                depth += 1
            elif sql[pos] == ')':
                depth -= 1
            pos += 1
        cte_body_ranges.append((m.end() - 1, pos))  # (pos de '(', pos après ')')

    if not conflits:
        return sql

    # Reconstruire le SQL en renommant uniquement hors des corps de CTEs
    parts = []
    last_end = 0
    for (body_start, body_end) in sorted(cte_body_ranges):
        # Segment AVANT ce corps (déclarations, virgules) → renommer les déclarations
        segment = sql[last_end:body_start]
        for nom in conflits:
            segment = re.sub(
                rf'((?:WITH|,)\s+){re.escape(nom)}(\s+AS\s*)',
                rf'\1cte_{nom}\2',
                segment, flags=re.IGNORECASE
            )
        parts.append(segment)
        # Corps du CTE → inchangé (la vraie table est référencée ici)
        parts.append(sql[body_start:body_end])
        last_end = body_end

    # SELECT final (après tous les CTEs) → renommer les références aux CTEs
    outer = sql[last_end:]
    for nom in conflits:
        outer = re.sub(rf'\b{re.escape(nom)}\b', f'cte_{nom}', outer, flags=re.IGNORECASE)
    parts.append(outer)

    return ''.join(parts)


def _reordonner_colonnes(df: pd.DataFrame) -> pd.DataFrame:
    """Ordonne les colonnes : 1) temps  2) dimensions  3) calculs (numériques)."""
    TEMPS = {"annee", "année", "an", "year", "mois", "month", "semaine", "week", "trimestre", "quarter"}
    temps_cols  = [c for c in df.columns if c.lower() in TEMPS]
    calc_cols   = [c for c in df.columns if c not in temps_cols and pd.api.types.is_numeric_dtype(df[c])]
    dim_cols    = [c for c in df.columns if c not in temps_cols and c not in calc_cols]
    return df[temps_cols + dim_cols + calc_cols]


def _forcer_annee_si_mois(sql: str) -> str:
    """Si le SQL groupe par MONTH(col) sans YEAR(col), injecte YEAR(col) dans SELECT et GROUP BY."""
    month_pattern = re.compile(r'MONTH\(([^)]+)\)', re.IGNORECASE)
    year_pattern  = re.compile(r'YEAR\(([^)]+)\)',  re.IGNORECASE)
    month_cols = {m.group(1).strip() for m in month_pattern.finditer(sql)}
    year_cols  = {m.group(1).strip() for m in year_pattern.finditer(sql)}
    missing = month_cols - year_cols
    for col in missing:
        year_expr = f"YEAR({col})"
        year_alias = f"YEAR({col}) AS annee"
        # Injecter dans le SELECT (avant le FROM)
        sql = re.sub(r'(SELECT\s)', rf'\1{year_alias}, ', sql, count=1, flags=re.IGNORECASE)
        # Injecter dans le GROUP BY
        sql = re.sub(r'(GROUP\s+BY\s)', rf'\1{year_expr}, ', sql, count=1, flags=re.IGNORECASE)
    return sql


def executer_sql(conn: sqlite3.Connection, sql: str) -> pd.DataFrame:
    _enregistrer_fonctions_custom(conn)
    sql = _renommer_ctes_en_conflit(sql, conn)
    sql = _forcer_annee_si_mois(sql)
    try:
        result = pd.read_sql_query(sql, conn)
        return _reordonner_colonnes(result)
    except Exception as e:
        # pd.read_sql_query lève pandas.errors.DatabaseError qui wrape sqlite3 — on normalise
        msg = str(e)
        if "no such table" in msg:
            table = msg.split("no such table:")[-1].strip().split("'")[0].strip()
            raise sqlite3.OperationalError(f"Table inconnue : « {table} ». Vérifiez le MCD.") from e
        if "no such column" in msg:
            col = msg.split("no such column:")[-1].strip().split("'")[0].strip()
            raise sqlite3.OperationalError(f"Colonne inconnue : « {col} ». Vérifiez le MCD.") from e
        if "ambiguous column name" in msg:
            col = msg.split("ambiguous column name:")[-1].strip()
            raise sqlite3.OperationalError(f"Colonne ambiguë : « {col} » — précisez la table (ex: table.{col.strip()}).") from e
        if "syntax error" in msg:
            raise sqlite3.OperationalError(f"Erreur de syntaxe SQL : {msg}") from e
        raise sqlite3.OperationalError(msg) from e
