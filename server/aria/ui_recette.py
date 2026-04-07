"""
ui_recette.py — Onglet Recette : rejoue les scénarios et affiche les résultats visuels.

Layout : liste des questions à gauche, résultat visuel à droite.
"""

import os
import time
import io
import json
import hashlib
import pandas as pd
import streamlit as st

from persistence import charger_sources, charger_mcd, sauvegarder_mcd
from mcd import generer_mcd_depuis_excel, _lire_excel
from db import creer_sqlite_en_memoire, executer_sql
from sql_ai import question_vers_sql, modifier_sql
from viz import generer_graphique_v2, generer_fiche_html

RECETTE_CACHE_FILE = "recette_cache.json"


def _sauvegarder_cache(resultats: list[dict]):
    """Sauvegarde le SQL et viz_config de chaque test sur disque (sans les DataFrames)."""
    cache = []
    for r in resultats:
        viz = r.get("viz_config") or {}
        cache.append({
            "question":  r["question"],
            "source":    r["source"],
            "ordre":     r["ordre"],
            "etat":      r["etat"],
            "detail":    r["detail"],
            "type_viz":  r["type_viz"],
            "duree_ia":  r["duree_ia"],
            "viz_config": viz if viz else None,
        })
    with open(RECETTE_CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False, indent=2)


def _charger_cache() -> list[dict] | None:
    """Charge le cache SQL depuis le disque. Retourne None si absent."""
    if not os.path.exists(RECETTE_CACHE_FILE):
        return None
    with open(RECETTE_CACHE_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


# ─── Chargement source ────────────────────────────────────────────────────────

def _charger_source_label(label: str) -> tuple:
    """Charge MCD + connexion SQLite pour un label de source."""
    sources = charger_sources()
    source = next((s for s in sources if s["label"] == label), None)
    if source is None:
        raise ValueError(f"Source '{label}' introuvable")
    source_path = os.path.normpath(source["path"])
    if not os.path.exists(source_path):
        raise FileNotFoundError(f"Fichier introuvable : {source_path}")
    mcd = charger_mcd(label)
    if not mcd:
        mcd, tables = generer_mcd_depuis_excel(source_path, label)
        sauvegarder_mcd(label, mcd)
    else:
        mtime = os.path.getmtime(source_path)
        all_sheets = _lire_excel(source_path, mtime)
        tables = {}
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
    conn = creer_sqlite_en_memoire(tables, mcd)
    return mcd, conn


def _resoudre_source(source_val: str, sources_dispo: list[dict]) -> str | None:
    """
    Trouve le label exact de la source à partir d'une valeur partielle.
    Ex : "DEYTIME" → "SOURCE_DEYTIME.xlsx"
    """
    val = source_val.strip()
    # Correspondance exacte (avec ou sans .xlsx)
    for s in sources_dispo:
        if s["label"] == val or s["label"] == val + ".xlsx":
            return s["label"]
    # Correspondance partielle (le label contient la valeur)
    val_up = val.upper()
    for s in sources_dispo:
        if val_up in s["label"].upper():
            return s["label"]
    return None


# ─── Lecture du fichier de recette ───────────────────────────────────────────

def _lire_recette(fichier) -> pd.DataFrame:
    df = pd.read_excel(fichier)
    df.columns = [c.strip().upper() for c in df.columns]
    required = {"SOURCE", "ORDRE", "QUESTION"}
    manquantes = required - set(df.columns)
    if manquantes:
        raise ValueError(f"Colonnes manquantes : {manquantes}")
    df["ORDRE"]    = pd.to_numeric(df["ORDRE"], errors="coerce").fillna(1).astype(int)
    df["QUESTION"] = df["QUESTION"].fillna("").astype(str).str.strip()
    return df.reset_index(drop=True)


# ─── Exécution de la recette ─────────────────────────────────────────────────

def _executer_recette(df: pd.DataFrame) -> list[dict]:
    """Lance tous les tests et stocke df_result + viz_config pour chaque ligne."""
    sources_dispo   = charger_sources()
    sources_cache   = {}
    resultats       = []
    sql_actuel      = None
    viz_config_actuel = None
    groupe_courant  = None

    for idx, row in df.iterrows():
        source_val = str(row["SOURCE"]).strip()
        ordre      = int(row["ORDRE"])
        question   = row["QUESTION"]

        # Résolution du label source
        source_label = _resoudre_source(source_val, sources_dispo)
        if source_label is None:
            resultats.append({
                "etat": "❌", "detail": f"Source '{source_val}' introuvable dans aria",
                "duree_ia": 0, "nb_lignes": 0, "type_viz": "",
                "df": None, "viz_config": None, "question": question,
                "source": source_val, "ordre": ordre,
            })
            continue

        nouveau_groupe = (source_label != groupe_courant) or (ordre == 1)

        # Chargement source (mis en cache)
        if source_label not in sources_cache:
            try:
                mcd, conn = _charger_source_label(source_label)
                sources_cache[source_label] = (mcd, conn)
            except Exception as e:
                resultats.append({
                    "etat": "❌", "detail": str(e),
                    "duree_ia": 0, "nb_lignes": 0, "type_viz": "",
                    "df": None, "viz_config": None, "question": question,
                    "source": source_val, "ordre": ordre,
                })
                continue

        mcd, conn = sources_cache[source_label]
        t0 = time.time()
        try:
            if nouveau_groupe or sql_actuel is None:
                viz = question_vers_sql(question, mcd)
                groupe_courant = source_label
            else:
                viz = modifier_sql(question, sql_actuel, viz_config_actuel, mcd)

            sql_actuel = viz["sql"]
            viz_config_actuel = viz
            duree = round(time.time() - t0, 1)
            df_result = executer_sql(conn, sql_actuel)
            resultats.append({
                "etat": "✅", "detail": "",
                "duree_ia": duree, "nb_lignes": len(df_result),
                "type_viz": viz.get("type_viz", ""),
                "df": df_result, "viz_config": viz,
                "question": question, "source": source_val, "ordre": ordre,
            })
        except Exception as e:
            duree = round(time.time() - t0, 1)
            resultats.append({
                "etat": "❌", "detail": str(e),
                "duree_ia": duree, "nb_lignes": 0, "type_viz": "",
                "df": None, "viz_config": None,
                "question": question, "source": source_val,
                "graphique": graphique, "ordre": ordre,
            })
            sql_actuel = None
            viz_config_actuel = None
            groupe_courant = None

    return resultats


# ─── Replay (ré-exécution SQL sans IA) ───────────────────────────────────────

def _rejouer_recette(resultats_precedents: list[dict]) -> list[dict]:
    """Re-exécute le SQL mémorisé sans appeler l'IA. Quasi instantané."""
    sources_dispo = charger_sources()
    sources_cache = {}
    nouveaux = []

    for res in resultats_precedents:
        # Si le test précédent n'avait pas de SQL (erreur source), on le garde tel quel
        viz_config = res.get("viz_config")
        if viz_config is None or not viz_config.get("sql"):
            nouveaux.append({**res, "detail": res.get("detail", "Pas de SQL mémorisé")})
            continue

        source_val   = res["source"]
        source_label = _resoudre_source(source_val, sources_dispo)
        if source_label is None:
            nouveaux.append({**res, "etat": "❌", "detail": f"Source '{source_val}' introuvable"})
            continue

        if source_label not in sources_cache:
            try:
                mcd, conn = _charger_source_label(source_label)
                sources_cache[source_label] = (mcd, conn)
            except Exception as e:
                nouveaux.append({**res, "etat": "❌", "detail": str(e), "df": None})
                continue

        _, conn = sources_cache[source_label]
        t0 = time.time()
        try:
            df_res = executer_sql(conn, viz_config["sql"])
            duree  = round(time.time() - t0, 3)
            nouveaux.append({**res, "etat": "✅", "detail": "",
                              "duree_ia": duree, "nb_lignes": len(df_res), "df": df_res})
        except Exception as e:
            nouveaux.append({**res, "etat": "❌", "detail": str(e), "df": None,
                              "duree_ia": round(time.time() - t0, 3)})

    return nouveaux


# ─── Affichage du résultat sélectionné ───────────────────────────────────────

def _afficher_resultat(res: dict):
    """Affiche le résultat visuel — identique à la page Questions."""
    if res["etat"] == "❌":
        st.error(f"**Erreur** : {res['detail']}")
        return

    df  = res["df"]
    viz = res["viz_config"]
    tv  = viz.get("type_viz", "table")

    st.caption(f"{res['nb_lignes']} ligne(s)  ·  {res['duree_ia']}s  ·  {tv}")

    if tv == "fiche":
        st.markdown(generer_fiche_html(df, viz), unsafe_allow_html=True)
    else:
        try:
            fig = generer_graphique_v2(df, viz)
            st.plotly_chart(fig, use_container_width=True)
        except Exception as e:
            st.warning(f"Rendu non disponible : {e}")
            st.dataframe(df, use_container_width=True, hide_index=True)


# ─── Page principale ──────────────────────────────────────────────────────────

def afficher_page_recette():
    st.markdown("## 🧪 Recette")

    # ── Upload ────────────────────────────────────────────────────────────────
    uploaded = st.file_uploader(
        "Fichier de recette (SOURCE | GRAPHIQUE | ORDRE | QUESTION)",
        type=["xlsx", "xls"],
        label_visibility="collapsed",
        key="recette_upload",
    )
    if uploaded:
        try:
            st.session_state.recette_df = _lire_recette(uploaded)
            if st.session_state.get("recette_fichier") != uploaded.name:
                st.session_state.recette_fichier  = uploaded.name
                st.session_state.recette_selected = 0
                # Charger le cache disque si disponible (SQL mémorisé)
                cache = _charger_cache()
                st.session_state.recette_resultats = cache  # None si pas de cache
        except Exception as e:
            st.error(f"Erreur lecture : {e}")
            return

    df_recette = st.session_state.get("recette_df")

    # Auto-replay : si les résultats (DataFrames) ont été purgés de la session
    # mais que le cache SQL est sur disque → rejouer silencieusement au retour sur la page
    if st.session_state.get("recette_resultats") is None and os.path.exists(RECETTE_CACHE_FILE):
        cache = _charger_cache()
        if cache:
            with st.spinner("Rechargement des résultats…"):
                nouveaux = _rejouer_recette(cache)
            st.session_state.recette_resultats = nouveaux
            st.session_state.recette_selected  = st.session_state.get("recette_selected", 0)
            st.rerun()

    if df_recette is None and st.session_state.get("recette_resultats") is None:
        st.info("Chargez un fichier Excel avec les colonnes : **SOURCE | ORDRE | QUESTION**")
        return

    total = len(df_recette) if df_recette is not None else len(st.session_state.get("recette_resultats", []))
    if df_recette is not None:
        st.caption(f"{total} test(s) · Sources : {', '.join(df_recette['SOURCE'].unique())}")

    # ── Boutons lancer / rejouer ───────────────────────────────────────────────
    resultats_existants = st.session_state.get("recette_resultats")
    cache_sur_disque    = os.path.exists(RECETTE_CACHE_FILE)
    peut_rejouer        = resultats_existants is not None or cache_sur_disque

    col_btn1, col_btn2, col_info = st.columns([2, 2, 4])
    with col_btn1:
        lancer  = st.button("▶ Régénérer", type="primary", use_container_width=True,
                            disabled=df_recette is None,
                            help="Appelle l'IA pour chaque question (~2-5s par test)")
    with col_btn2:
        rejouer = st.button("⚡ Rejouer", use_container_width=True,
                            disabled=not peut_rejouer,
                            help="Ré-exécute le SQL mémorisé sans appeler l'IA (instantané)")
    with col_info:
        if cache_sur_disque and resultats_existants is None:
            st.caption("💾 Cache disponible — cliquez ⚡ Rejouer pour charger instantanément")

    if rejouer:
        cache = resultats_existants or _charger_cache()
        if cache:
            barre = st.progress(0, text="Replay…")
            nouveaux = _rejouer_recette(cache)
            barre.progress(1.0, text="Terminé ✅")
            st.session_state.recette_resultats = nouveaux
            st.session_state.recette_selected  = 0
            st.rerun()

    if lancer:
        st.session_state.recette_resultats = None
        st.session_state.recette_selected  = 0
        barre = st.progress(0, text="Démarrage…")
        placeholder = st.empty()

        # Cache existant indexé par (source, question) pour réutiliser le SQL des questions connues
        cache_existant = _charger_cache() or []
        cache_index = {(r["source"].strip().upper(), r["question"].strip().upper()): r
                       for r in cache_existant if r.get("viz_config")}

        resultats = []
        sources_dispo = charger_sources()
        sources_cache = {}
        sql_actuel = None
        viz_config_actuel = None
        groupe_courant = None

        for i, (idx, row) in enumerate(df_recette.iterrows()):
            source_val = str(row["SOURCE"]).strip()
            ordre      = int(row["ORDRE"])
            question   = row["QUESTION"]
            placeholder.text(f"⏳ {question[:70]}")
            barre.progress((i + 1) / total, text=f"{i+1}/{total} — {question[:50]}…")

            source_label = _resoudre_source(source_val, sources_dispo)
            if source_label is None:
                resultats.append({"etat": "❌", "detail": f"Source '{source_val}' introuvable",
                                   "duree_ia": 0, "nb_lignes": 0, "type_viz": "",
                                   "df": None, "viz_config": None, "question": question,
                                   "source": source_val, "ordre": ordre})
                continue

            nouveau_groupe = (source_label != groupe_courant) or (ordre == 1)

            if source_label not in sources_cache:
                try:
                    mcd, conn = _charger_source_label(source_label)
                    sources_cache[source_label] = (mcd, conn)
                except Exception as e:
                    resultats.append({"etat": "❌", "detail": str(e),
                                       "duree_ia": 0, "nb_lignes": 0, "type_viz": "",
                                       "df": None, "viz_config": None, "question": question,
                                       "source": source_val, "ordre": ordre})
                    continue

            mcd, conn = sources_cache[source_label]
            t0 = time.time()
            try:
                # Réutiliser le SQL du cache si la question est déjà connue
                cle_cache = (source_val.strip().upper(), question.strip().upper())
                cached = cache_index.get(cle_cache)

                if cached and cached.get("viz_config"):
                    viz = cached["viz_config"]
                    placeholder.text(f"💾 (cache) {question[:65]}")
                elif nouveau_groupe or sql_actuel is None:
                    viz = question_vers_sql(question, mcd)
                    groupe_courant = source_label
                else:
                    viz = modifier_sql(question, sql_actuel, viz_config_actuel, mcd)
                    viz["type_viz"] = viz_config_actuel.get("type_viz", viz.get("type_viz"))

                sql_actuel = viz["sql"]
                viz_config_actuel = viz
                duree = round(time.time() - t0, 1)
                df_res = executer_sql(conn, sql_actuel)
                resultats.append({"etat": "✅", "detail": "", "duree_ia": duree,
                                   "nb_lignes": len(df_res), "type_viz": viz.get("type_viz", ""),
                                   "df": df_res, "viz_config": viz, "question": question,
                                   "source": source_val, "ordre": ordre})
            except Exception as e:
                duree = round(time.time() - t0, 1)
                resultats.append({"etat": "❌", "detail": str(e), "duree_ia": duree,
                                   "nb_lignes": 0, "type_viz": "",
                                   "df": None, "viz_config": None, "question": question,
                                   "source": source_val, "ordre": ordre})
                sql_actuel = None
                viz_config_actuel = None
                groupe_courant = None

        barre.progress(1.0, text="Terminé ✅")
        placeholder.empty()
        _sauvegarder_cache(resultats)  # SQL mémorisé sur disque pour Rejouer instantané
        st.session_state.recette_resultats = resultats
        st.session_state.recette_selected  = 0
        st.rerun()

    # ── Affichage gauche / droite ─────────────────────────────────────────────
    resultats = st.session_state.get("recette_resultats")
    if not resultats:
        return

    nb_ok  = sum(1 for r in resultats if r["etat"] == "✅")
    nb_err = sum(1 for r in resultats if r["etat"] == "❌")
    st.caption(f"✅ {nb_ok} OK  ·  ❌ {nb_err} erreur(s)")

    # CSS : panneau droit sticky → le graphique reste visible pendant le scroll de la liste
    st.markdown("""
    <style>
    [data-testid="stHorizontalBlock"] > div:last-child {
        position: sticky;
        top: 3.5rem;
        align-self: flex-start;
        max-height: calc(100vh - 5rem);
        overflow-y: auto;
    }
    </style>
    """, unsafe_allow_html=True)

    col_liste, col_resultat = st.columns([2, 3], gap="medium")

    with col_liste:
        st.markdown("**Questions**")
        for i, res in enumerate(resultats):
            selected = st.session_state.get("recette_selected", 0) == i
            label = f"{res['etat']} **{res['source']}** · #{res['ordre']}  \n{res['question'][:60]}"
            btn_type = "primary" if selected else "secondary"
            if st.button(label, key=f"rec_{i}", use_container_width=True, type=btn_type):
                st.session_state.recette_selected = i
                st.rerun()

    with col_resultat:
        idx_sel = st.session_state.get("recette_selected", 0)
        if 0 <= idx_sel < len(resultats):
            res_sel = resultats[idx_sel]
            st.markdown(f"**{res_sel['source']}** · étape {res_sel['ordre']}")
            _afficher_resultat(res_sel)

    # ── Export ────────────────────────────────────────────────────────────────
    st.divider()
    df_export = pd.DataFrame([{
        "SOURCE":    r["source"],
        "ORDRE":     r["ordre"],
        "QUESTION":  r["question"],
        "ETAT":      r["etat"],
        "DURÉE (s)": r["duree_ia"],
        "LIGNES":    r["nb_lignes"],
        "VIZ":       r["type_viz"],
        "DÉTAIL":    r["detail"],
    } for r in resultats])
    buf = io.BytesIO()
    df_export.to_excel(buf, index=False)
    st.download_button("⬇ Télécharger les résultats", data=buf.getvalue(),
                       file_name="recette_resultats.xlsx",
                       mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
