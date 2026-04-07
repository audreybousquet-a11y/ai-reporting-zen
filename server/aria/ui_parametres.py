"""
ui_parametres.py — Page Paramètres
"""

import json
import os

import streamlit as st

from persistence import (
    DATA_SOURCES_FILE, SOURCES_FOLDER,
    get_mcd_file, get_favoris_file, get_dashboards_file,
)


def afficher_page_parametres(charger_source):
    """
    charger_source est passé en argument depuis aria.py pour éviter l'import circulaire.
    """
    import glob
    import shutil
    from persistence import charger_sources

    # Import local pour accéder à RULES_DIR depuis sql_ai
    from sql_ai import RULES_DIR, _get_rules_filename

    sources = charger_sources()
    st.markdown("## ⚙️ Paramètres")
    st.caption("⚠️ Réinitialiser supprime toutes les sources, favoris et configurations.")
    if st.button("🔄 Réinitialiser", use_container_width=False):
        for f in glob.glob("favoris_*.json") + glob.glob("mcd_*.json") + glob.glob("dashboards_*.json"):
            os.remove(f)
        # Supprimer les règles des sources (garder base.md et deytime.md)
        protected = {"base.md", "deytime.md"}
        for f in glob.glob(os.path.join(RULES_DIR, "*.md")):
            if os.path.basename(f) not in protected:
                os.remove(f)
        with open(DATA_SOURCES_FILE, "w", encoding="utf-8") as f:
            json.dump([], f)
        if os.path.exists(SOURCES_FOLDER):
            shutil.rmtree(SOURCES_FOLDER)
            os.makedirs(SOURCES_FOLDER, exist_ok=True)
        for key in ("mcd", "db_conn", "favoris", "historique", "source_label"):
            st.session_state[key] = None if key in ("mcd", "db_conn") else ([] if key in ("favoris", "historique") else "")
        st.session_state.upload_key += 1
        st.session_state.just_reset = True
        st.session_state.sources_traitees = []
        st.session_state.page = "parametres"
        st.rerun()

    st.divider()
    st.markdown("#### 📂 Sources de données")
    if sources:
        for i, s in enumerate(sources):
            col1, col2, col3, col4 = st.columns([5, 2, 2, 2])
            with col1:
                actif = s["label"] == st.session_state.source_label
                badge = " 🟢" if actif else ""
                st.markdown(f"**{s['label']}**{badge}")
            with col2:
                if st.button("▶ Utiliser", key=f"use_{i}"):
                    try:
                        charger_source(s)
                        st.rerun()
                    except Exception as e:
                        st.error(f"Erreur : {e}")
            with col3:
                if st.button("🔄 Mettre à jour", key=f"upd_{i}"):
                    st.session_state[f"show_update_{i}"] = not st.session_state.get(f"show_update_{i}", False)
            with col4:
                if st.button("🗑 Supprimer", key=f"del_{i}"):
                    supprimee = sources.pop(i)
                    with open(DATA_SOURCES_FILE, "w", encoding="utf-8") as f:
                        json.dump(sources, f, indent=2)
                    # Supprimer les fichiers associés à cette source
                    for f_path in [
                        get_mcd_file(supprimee["label"]),
                        get_favoris_file(supprimee["label"]),
                        get_dashboards_file(supprimee["label"]),
                        os.path.join(RULES_DIR, _get_rules_filename(supprimee["label"])),
                    ]:
                        if os.path.exists(f_path):
                            os.remove(f_path)
                    if supprimee["label"] == st.session_state.source_label:
                        for key in ("mcd", "db_conn"):
                            st.session_state[key] = None
                        for key in ("favoris", "historique", "dashboards"):
                            st.session_state[key] = []
                        st.session_state.source_label = ""
                    st.rerun()

            # Zone de mise à jour (visible uniquement si le bouton a été cliqué)
            if st.session_state.get(f"show_update_{i}", False):
                updated_file = st.file_uploader(
                    f"Nouveau fichier Excel pour **{s['label']}** (favoris et dashboards conservés)",
                    type=["xlsx", "xls"],
                    key=f"uploader_upd_{i}",
                )
                if updated_file:
                    # Écraser le fichier existant
                    with open(s["path"], "wb") as f:
                        f.write(updated_file.getbuffer())
                    # Supprimer le cache MCD pour forcer la ré-analyse
                    mcd_path = get_mcd_file(s["label"])
                    if os.path.exists(mcd_path):
                        os.remove(mcd_path)
                    st.session_state[f"show_update_{i}"] = False
                    st.success("Fichier mis à jour ✅ — favoris et dashboards conservés")
                    try:
                        charger_source(s)
                    except Exception as e:
                        st.error(f"Erreur au rechargement : {e}")
                    st.rerun()
    else:
        st.caption("Aucune source enregistrée.")

    st.markdown("#### ➕ Ajouter une source Excel")
    uploaded = st.file_uploader("Fichier Excel", type=["xlsx", "xls"], label_visibility="collapsed")

    if uploaded and uploaded.name not in st.session_state.get("sources_traitees", []):
        st.session_state.sources_traitees.append(uploaded.name)
        file_path = os.path.join(SOURCES_FOLDER, uploaded.name)
        with open(file_path, "wb") as f:
            f.write(uploaded.getbuffer())
        labels_existants = [s["label"] for s in sources]
        if uploaded.name not in labels_existants:
            sources.append({"label": uploaded.name, "path": file_path})
            with open(DATA_SOURCES_FILE, "w", encoding="utf-8") as f:
                json.dump(sources, f, indent=2)
            st.success("Source enregistrée ✅")
        else:
            st.info("Cette source existe déjà")
        st.rerun()

    if st.session_state.mcd:
        st.divider()
        st.markdown("#### 📋 Tables disponibles")
        mcd = st.session_state.mcd
        total_lignes = sum(t["nb_lignes"] for t in mcd["tables"])
        st.caption(f"{mcd['nb_tables']} tables · {total_lignes:,} lignes au total · Source : **{st.session_state.source_label}**")
        cols_tables = st.columns(2)
        for idx, t in enumerate(mcd["tables"]):
            with cols_tables[idx % 2]:
                nb_cols = len(t["colonnes"])
                with st.expander(f"{t['label']} — {t['nb_lignes']:,} lignes · {nb_cols} colonnes"):
                    for c in t["colonnes"]:
                        fk_str = f" → `{c['fk']['table']}`" if c.get("fk") else ""
                        st.caption(f"`{c['nom']}` — {c['type_sql']}{fk_str}")
