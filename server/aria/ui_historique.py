"""
ui_historique.py — Page Historique
"""

from datetime import datetime, timedelta

import streamlit as st

from persistence import charger_historique, sauvegarder_historique, sauvegarder_favoris


def _render_hist_item(item, source, historique_json):
    item_id     = item.get("id", "")
    est_epingle = item.get("epingle", False)
    ts_raw      = item.get("ts_full", item.get("ts", ""))
    ts_display  = ts_raw[11:16] if len(ts_raw) >= 16 else ts_raw  # HH:MM uniquement

    col_pin, col_q, col_ts, col_replay, col_fav, col_del = st.columns([0.4, 6, 1.2, 1.2, 1.2, 0.5])

    with col_pin:
        if st.button("📌" if est_epingle else "☆", key=f"pin_{item_id}",
                     help="Désépingler" if est_epingle else "Épingler en haut"):
            for h in historique_json:
                if h.get("id") == item_id:
                    h["epingle"] = not est_epingle
                    break
            sauvegarder_historique(source, historique_json)
            st.rerun()
    with col_q:
        st.markdown(item["question"])
    with col_ts:
        st.caption(ts_display)
    with col_replay:
        if st.button("▶ Rejouer", key=f"replay_{item_id}", use_container_width=True):
            st.session_state.question_prefill = item["question"]
            st.session_state.page = "app"
            st.rerun()
    with col_fav:
        titre_fav    = item["viz_config"].get("titre", item["question"])[:40]
        fav_existant = next((f for f in st.session_state.favoris if f.get("titre") == titre_fav), None)
        if fav_existant:
            st.button("✅ Favori", key=f"fav_{item_id}", use_container_width=True, disabled=True)
        else:
            if st.button("⭐ Favori", key=f"fav_{item_id}", use_container_width=True):
                st.session_state.favoris.append({
                    "titre":         titre_fav,
                    "question":      item["question"],
                    "sql":           item["sql"],
                    "viz_config":    item["viz_config"].copy(),
                    "saved_at":      datetime.now().strftime("%d/%m %H:%M"),
                    "dashboard_ids": [],
                })
                sauvegarder_favoris(source, st.session_state.favoris)
                st.rerun()
    with col_del:
        if st.button("🗑", key=f"del_{item_id}", use_container_width=True, help="Supprimer"):
            historique_json[:] = [h for h in historique_json if h.get("id") != item_id]
            sauvegarder_historique(source, historique_json)
            st.session_state.historique = [
                h for h in st.session_state.historique if h.get("id") != item_id
            ]
            st.rerun()


def afficher_page_historique():
    source = st.session_state.source_label

    if not source:
        st.info("Chargez une source de données pour consulter l'historique.")
    else:
        historique_json = charger_historique(source)

        col_titre, col_clear = st.columns([5, 1])
        with col_titre:
            st.markdown("## 🕘 Historique")
        with col_clear:
            if historique_json:
                if st.button("🗑 Tout effacer", use_container_width=True):
                    sauvegarder_historique(source, [])
                    st.session_state.historique = []
                    st.rerun()

        if not historique_json:
            st.markdown("""
            <div class="empty-state" style="padding:2rem;">
                <div class="empty-state-icon">🕘</div>
                <div class="empty-state-title">Aucun historique</div>
                <div class="empty-state-sub">Vos questions apparaîtront ici après votre première analyse.</div>
            </div>
            """, unsafe_allow_html=True)
        else:
            nb_total = len(historique_json)
            st.caption(f"{nb_total} question{'s' if nb_total > 1 else ''} enregistrée{'s' if nb_total > 1 else ''}")

            recherche = st.text_input("", placeholder="🔍 Filtrer les questions…",
                                      label_visibility="collapsed", key="hist_search")
            items = historique_json
            if recherche.strip():
                items = [i for i in items if recherche.lower() in i["question"].lower()]
                if not items:
                    st.caption("Aucun résultat pour cette recherche.")

            epingles    = [i for i in items if i.get("epingle")]
            non_epingles = [i for i in items if not i.get("epingle")]

            if epingles:
                st.markdown("### 📌 Épinglées")
                for item in epingles:
                    _render_hist_item(item, source, historique_json)

            today      = datetime.now().date()
            yesterday  = today - timedelta(days=1)
            week_start = today - timedelta(days=today.weekday())

            groupes = [
                ("Aujourd'hui",   lambda d: d == today),
                ("Hier",          lambda d: d == yesterday),
                ("Cette semaine", lambda d: week_start <= d < yesterday),
                ("Plus ancien",   lambda d: d < week_start),
            ]

            for nom_groupe, condition in groupes:
                def _parse_date(item):
                    ts = item.get("ts_full", "")
                    try:
                        return datetime.strptime(ts[:10], "%Y-%m-%d").date()
                    except Exception:
                        return today

                groupe_items = [i for i in non_epingles if condition(_parse_date(i))]
                if groupe_items:
                    st.markdown(f"### {nom_groupe} ({len(groupe_items)})")
                    for item in groupe_items:
                        _render_hist_item(item, source, historique_json)

    if st.button("← Retour", key="hist_back"):
        st.session_state.page = "app"
        st.rerun()
