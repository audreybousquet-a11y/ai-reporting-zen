"""
ui_dashboards.py — Page Dashboards
"""

import sqlite3
import uuid

import streamlit as st
import streamlit.components.v1 as components

from persistence import sauvegarder_dashboards, sauvegarder_favoris
from viz import generer_graphique_v2, generer_fiche_html
from db import executer_sql


def _afficher_contenu_dashboard(db_id):
    favoris_db = [f for f in st.session_state.favoris if db_id in f.get("dashboard_ids", [])]
    if not favoris_db:
        st.caption("Aucun favori dans ce dashboard — éditez un favori (⋯) et cochez-le.")
        return

    # ── Appliquer l'ordre sauvegardé ─────────────────────────────────────────
    db_obj = next((d for d in st.session_state.dashboards if d["id"] == db_id), None)
    order  = db_obj.get("order", []) if db_obj else []
    if order:
        keyed      = {f["titre"]: f for f in favoris_db}
        favoris_db = [keyed[t] for t in order if t in keyed] + \
                     [f for f in favoris_db if f["titre"] not in order]

    # Boutons ▲/▼ : injection JS pour contourner la spécificité Emotion
    _theme = st.session_state.get("theme", "dark")
    if _theme != "dark":
        _accent       = "#e8a020" if _theme == "deytime" else "#3AA48A"
        _accent_hover = "#f0b535" if _theme == "deytime" else "#2d8270"
        components.html(f"""
        <script>
        (function() {{
            function styleArrowButtons() {{
                var doc = window.parent.document;
                var btns = doc.querySelectorAll('[data-testid="stButton"] button');
                btns.forEach(function(btn) {{
                    var txt = btn.textContent.trim();
                    if (txt === '\u25b2' || txt === '\u25bc') {{
                        btn.style.setProperty('background', '{_accent}', 'important');
                        btn.style.setProperty('color', '#fff', 'important');
                        btn.style.setProperty('border', 'none', 'important');
                        btn.style.setProperty('border-radius', '4px', 'important');
                    }}
                }});
            }}
            styleArrowButtons();
            var observer = new MutationObserver(styleArrowButtons);
            observer.observe(window.parent.document.body, {{childList: true, subtree: true}});
        }})();
        </script>
        """, height=0)

    def _move(direction, titre):
        titres = [f["titre"] for f in favoris_db]
        i = titres.index(titre)
        j = i + direction
        if 0 <= j < len(titres):
            titres[i], titres[j] = titres[j], titres[i]
        if db_obj is not None:
            db_obj["order"] = titres
            sauvegarder_dashboards(st.session_state.source_label, st.session_state.dashboards)
        st.rerun()

    from datetime import datetime
    maj = datetime.now().strftime("%H:%M:%S")
    st.caption(f"🔄 Données actualisées à {maj}")
    n    = len(favoris_db)
    cols = st.columns(2)
    for idx, fav in enumerate(favoris_db):
        with cols[idx % 2]:
            h_title, h_up, h_dn = st.columns([6, 1, 1])
            with h_title:
                st.markdown(f"**{fav['titre']}**")
            with h_up:
                if st.button("▲", key=f"up_{db_id}_{idx}", disabled=(idx == 0),
                             help="Monter", use_container_width=True):
                    _move(-1, fav["titre"])
            with h_dn:
                if st.button("▼", key=f"dn_{db_id}_{idx}", disabled=(idx == n - 1),
                             help="Descendre", use_container_width=True):
                    _move(+1, fav["titre"])
            with st.spinner("Chargement…"):
                try:
                    result = executer_sql(st.session_state.db_conn, fav["sql"])
                    if fav["viz_config"].get("type_viz") == "fiche":
                        st.markdown(generer_fiche_html(result, fav["viz_config"]), unsafe_allow_html=True)
                    else:
                        fig = generer_graphique_v2(result, fav["viz_config"])
                        st.plotly_chart(fig, use_container_width=True, key=f"dash_{db_id}_{idx}")
                except sqlite3.Error as e:
                    st.warning(f"⚠️ {fav['titre']} — SQL invalide : {e}")
                except Exception as e:
                    st.error(f"❌ {e}")


def afficher_page_dashboards():
    col_titre_db, col_refresh = st.columns([6, 1])
    with col_titre_db:
        st.markdown("## 📌 Dashboards")
    with col_refresh:
        if st.button("🔄", help="Actualiser les données", use_container_width=True):
            st.session_state.db_conn = None
            st.rerun()
    st.divider()

    # ── Créer un nouveau dashboard ────────────────────────────────────────────
    if "new_db_expanded" not in st.session_state:
        st.session_state.new_db_expanded = not bool(st.session_state.dashboards)
    arrow = "▲" if st.session_state.new_db_expanded else "▼"
    if st.button(f"➕ Nouveau dashboard {arrow}", key="toggle_new_db_btn", use_container_width=True):
        st.session_state.new_db_expanded = not st.session_state.new_db_expanded
        st.rerun()
    if st.session_state.new_db_expanded:
        with st.container(border=True):
            if st.session_state.get("_reset_new_db_name"):
                st.session_state["new_db_name"] = ""
                st.session_state["_reset_new_db_name"] = False
            nouveau_nom = st.text_input("Nom du dashboard", placeholder="Ex : Suivi RH, Activité chantiers…", key="new_db_name")
            if st.button("Créer", key="create_db_btn") and nouveau_nom.strip():
                new_id = uuid.uuid4().hex[:8]
                st.session_state.dashboards.append({"id": new_id, "nom": nouveau_nom.strip()})
                sauvegarder_dashboards(st.session_state.source_label, st.session_state.dashboards)
                st.session_state.dashboard_actif = new_id
                st.session_state["_reset_new_db_name"] = True
                st.session_state.new_db_expanded = False
                st.rerun()

    if not st.session_state.dashboards:
        st.markdown("""
        <div class="empty-state">
            <div class="empty-state-icon">📌</div>
            <div class="empty-state-title">Aucun dashboard</div>
            <div class="empty-state-sub">Créez votre premier dashboard ci-dessus.</div>
        </div>
        """, unsafe_allow_html=True)
        st.stop()

    # ── Tabs : un onglet par dashboard ───────────────────────────────────────
    noms = [db["nom"] for db in st.session_state.dashboards]
    actif_idx = next(
        (i for i, db in enumerate(st.session_state.dashboards) if db["id"] == st.session_state.dashboard_actif),
        0
    )
    tabs = st.tabs(noms)

    for i, (tab, db) in enumerate(zip(tabs, st.session_state.dashboards)):
        with tab:
            if i == actif_idx or True:   # on rend tous les onglets accessibles
                col_nom, col_rename, col_del = st.columns([5, 1, 1])
                with col_nom:
                    st.markdown(f"### {db['nom']}")
                with col_rename:
                    if st.button("✏️", key=f"ren_{db['id']}"):
                        st.session_state[f"renaming_{db['id']}"] = not st.session_state.get(f"renaming_{db['id']}", False)
                        st.rerun()
                with col_del:
                    if st.button("🗑", key=f"suppr_{db['id']}"):
                        st.session_state.dashboards = [d for d in st.session_state.dashboards if d["id"] != db["id"]]
                        for fav in st.session_state.favoris:
                            ids = fav.get("dashboard_ids", [])
                            if db["id"] in ids:
                                ids.remove(db["id"])
                        sauvegarder_dashboards(st.session_state.source_label, st.session_state.dashboards)
                        sauvegarder_favoris(st.session_state.source_label, st.session_state.favoris)
                        st.session_state.dashboard_actif = st.session_state.dashboards[0]["id"] if st.session_state.dashboards else None
                        st.rerun()

                if st.session_state.get(f"renaming_{db['id']}"):
                    new_nom = st.text_input("Nouveau nom", value=db["nom"], key=f"rename_input_{db['id']}")
                    if st.button("✅ Valider", key=f"rename_ok_{db['id']}"):
                        for d in st.session_state.dashboards:
                            if d["id"] == db["id"]:
                                d["nom"] = new_nom.strip()
                        sauvegarder_dashboards(st.session_state.source_label, st.session_state.dashboards)
                        st.session_state[f"renaming_{db['id']}"] = False
                        st.rerun()

                st.divider()
                _afficher_contenu_dashboard(db["id"])
