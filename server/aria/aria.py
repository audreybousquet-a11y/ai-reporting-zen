"""
AR.IA v2 — Architecture SQLite
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Refonte complète :
  Phase 1 — MCD propre avec types SQL (mcd_NomFichier.json)
  Phase 2 — SQLite en mémoire (DataFrames → tables SQL)
  Phase 3 — IA génère SQL pur → SQLite exécute → Plotly

Stack : Streamlit + OpenAI (GPT-4o) + Pandas + Plotly + SQLite
"""

import io
import json
import os
import re
import sqlite3
import uuid
from datetime import datetime
from pathlib import Path

import pandas as pd
import streamlit as st

from persistence import (
    DATA_SOURCES_FILE, SOURCES_FOLDER,
    charger_sources, get_favoris_file, charger_favoris, sauvegarder_favoris,
    get_dashboards_file, charger_dashboards, sauvegarder_dashboards,
    get_mcd_file, charger_mcd, sauvegarder_mcd,
)
from mcd import detecter_type_sql, detecter_pk, detecter_fks, analyser_colonne_mcd, _lire_excel, generer_mcd_depuis_excel
from db import normaliser_colonne_pour_sqlite, creer_sqlite_en_memoire, executer_sql, _renommer_ctes_en_conflit, _reordonner_colonnes, _forcer_annee_si_mois
from sql_ai import (
    NOM_MOIS, question_vers_sql, corriger_sql, est_modification, modifier_sql,
    _tri_python, _construire_df_affiche, _ajouter_colonne_python,
    _MOD_SORT_SEARCH, _MOD_ADD_SEARCH, _MOD_REMOVE_SEARCH, _MOD_RENAME_SEARCH,
    MODIFIER_PREFIXES_ADD, MODIFIER_PREFIXES_REMOVE, MODIFIER_PREFIXES_SORT,
    MODIFIER_PREFIXES_CALC, MODIFIER_PREFIXES_RENAME, MODIFIER_PREFIXES_REORDER,
)
from viz import COLORS_DARK, COLORS_LIGHT, COLORS_DEYTIME, generer_graphique_v2, generer_fiche_html, generer_commentaire_v2
from ui_dashboards import afficher_page_dashboards
from ui_parametres import afficher_page_parametres
from ui_aide import afficher_page_aide
from ui_emails import afficher_page_emails

# ─── CONSTANTES ───────────────────────────────────────────────────────────────

APP_FILE_PATH = str(Path(__file__).resolve())
APP_IMPORT_DATETIME = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

# ─── CONFIG PAGE ──────────────────────────────────────────────────────────────

_favicon_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Logo_blanc.png")
_favicon = _favicon_path if os.path.exists(_favicon_path) else "🅰"

st.set_page_config(
    page_title="ar.ia",
    page_icon=_favicon,
    layout="wide",
    initial_sidebar_state="expanded"
)

# ─── CHARGEMENT CSS EXTERNE ───────────────────────────────────────────────────

def charger_css(mode: str = "dark"):
    css_file = f"style_{mode}.css"
    if os.path.exists(css_file):
        with open(css_file, "r", encoding="utf-8") as f:
            css = f.read()
        # Injecter le pattern sidebar en base64 selon le mode
        import base64
        pattern_files = {"light": "fond_vert.png", "dark": "fond_noir.png"}
        pattern_file = pattern_files.get(mode)
        if pattern_file and os.path.exists(pattern_file):
            with open(pattern_file, "rb") as img:
                b64 = base64.b64encode(img.read()).decode()
            css += f"""
section[data-testid="stSidebar"] {{
    background-image: url("data:image/png;base64,{b64}") !important;
    background-repeat: repeat !important;
    background-color: transparent !important;
}}
"""
        st.markdown(f"<style>{css}</style>", unsafe_allow_html=True)
    else:
        st.warning(f"Fichier CSS introuvable : {css_file}")

# ─── INITIALISATION SESSION STATE ────────────────────────────────────────────

def init_state():
    defaults = {
        "page": "parametres",
        "mcd": None,
        "db_conn": None,
        "favoris": [],
        "historique": [],
        "source_label": "",
        "upload_key": 0,
        "just_reset": False,
        "sources_traitees": [],
        "theme": "dark",
        "question_prefill": "",
        "clear_input": False,
        "dashboards": [],
        "dashboard_actif": None,
    }
    for k, v in defaults.items():
        if k not in st.session_state:
            st.session_state[k] = v

init_state()

# ─── AUTHENTIFICATION ─────────────────────────────────────────────────────────

_LOGIN = os.environ.get("ARIA_LOGIN", "admin")
_PASSWORD = os.environ.get("ARIA_PASSWORD", "aria2024")

if "authenticated" not in st.session_state:
    st.session_state.authenticated = False
if "logout_redirect" not in st.session_state:
    st.session_state.logout_redirect = False

if st.session_state.logout_redirect:
    st.session_state.logout_redirect = False
    st.markdown('<meta http-equiv="refresh" content="0;url=https://ar-ia.fr">', unsafe_allow_html=True)
    st.stop()

if not st.session_state.authenticated:
    st.markdown("""
    <style>
    #MainMenu, header, footer, [data-testid="stSidebar"] { visibility: hidden; }
    .stApp { background: #f0fdf4; }
    div[data-testid="stForm"] {
        background: white;
        border-radius: 16px;
        padding: 32px;
        box-shadow: 0 4px 24px rgba(45,149,131,0.10);
        border: 1px solid #a7d8d1;
    }
    .stTextInput label { color: #2D9583 !important; font-weight: 600 !important; }
    .stTextInput input {
        border: 2px solid #2D9583 !important;
        border-radius: 8px !important;
        background: white !important;
        background-color: white !important;
        color: #0f172a !important;
        -webkit-text-fill-color: #0f172a !important;
        caret-color: #0f172a !important;
    }
    .stTextInput input:focus {
        border-color: #2D9583 !important;
        box-shadow: 0 0 0 3px rgba(45,149,131,0.15) !important;
        background: white !important;
        background-color: white !important;
    }
    .stTextInput input:-webkit-autofill,
    .stTextInput input:-webkit-autofill:focus {
        -webkit-box-shadow: 0 0 0 1000px white inset !important;
        -webkit-text-fill-color: #0f172a !important;
    }
    .stFormSubmitButton button {
        background-color: #2D9583 !important;
        color: white !important;
        border-radius: 8px !important;
        font-weight: 600 !important;
        border: none !important;
        width: 100% !important;
    }
    .stFormSubmitButton button:hover { background-color: #247a6a !important; }
    </style>
    """, unsafe_allow_html=True)
    st.markdown("<br><br>", unsafe_allow_html=True)
    _, col, _ = st.columns([1, 1, 1])
    with col:
        logo_path = os.path.join(os.path.dirname(__file__), "logo-aria.png")
        if os.path.exists(logo_path):
            _, lc, _ = st.columns([1, 2, 1])
            with lc:
                st.image(logo_path, use_container_width=True)
        st.markdown('<p style="text-align:center;color:#2D9583;font-size:0.9rem;margin-bottom:20px;">Intelligence artificielle pour vos données</p>', unsafe_allow_html=True)
        st.markdown("""
        <script>
        setTimeout(function() {
            document.querySelectorAll('input[type=text], input[type=password]').forEach(function(el) {
                el.setAttribute('autocomplete', 'off');
            });
        }, 500);
        </script>
        """, unsafe_allow_html=True)
        with st.form("login_form"):
            username = st.text_input("Identifiant")
            password = st.text_input("Mot de passe", type="password")
            submitted = st.form_submit_button("Se connecter", use_container_width=True)
            if submitted:
                if username == _LOGIN and password == _PASSWORD:
                    st.session_state.authenticated = True
                    st.rerun()
                else:
                    st.error("Identifiants incorrects")
    st.stop()

charger_css(st.session_state.theme)
_theme = st.session_state.theme
COLORS = COLORS_DEYTIME if _theme == "deytime" else (COLORS_DARK if _theme == "dark" else COLORS_LIGHT)

# ─────────────────────────────────────────────────────────────────────────────
# CHARGEMENT INITIAL DES SOURCES
# ─────────────────────────────────────────────────────────────────────────────

def charger_source(source: dict):
    source_path = os.path.normpath(source["path"])
    if not os.path.exists(source_path):
        st.warning(f"Fichier introuvable : {source_path}")
        return
    mcd = charger_mcd(source["label"])
    if not mcd:
        with st.spinner("Analyse du fichier Excel…"):
            mcd, tables = generer_mcd_depuis_excel(source_path, source["label"])
    else:
        tables = {}
        mtime = os.path.getmtime(source_path)
        all_sheets = _lire_excel(source_path, mtime)
        for sheet_name, df in all_sheets.items():
            if df.empty or len(df.columns) < 2: continue
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
        # Mettre à jour nb_lignes dans le MCD avec les données actuelles
        for t in mcd["tables"]:
            if t["id"] in tables:
                t["nb_lignes"] = len(tables[t["id"]])
        mcd["generated_at"] = datetime.now().isoformat()
        sauvegarder_mcd(source["label"], mcd)
    with st.spinner("Chargement en base SQLite…"):
        conn = creer_sqlite_en_memoire(tables, mcd)
    st.session_state.mcd = mcd
    st.session_state.db_conn = conn
    st.session_state.source_label = source["label"]
    favoris = charger_favoris(source["label"])
    dashboards = charger_dashboards(source["label"])

    # Migration : anciens favoris avec afficher_dashboard=True → dashboard_ids
    dashboard_defaut_id = None
    for fav in favoris:
        if fav.get("afficher_dashboard") and not fav.get("dashboard_ids"):
            if not dashboard_defaut_id:
                if not dashboards:
                    dashboard_defaut_id = uuid.uuid4().hex[:8]
                    dashboards.append({"id": dashboard_defaut_id, "nom": "Dashboard principal"})
                else:
                    dashboard_defaut_id = dashboards[0]["id"]
            fav["dashboard_ids"] = [dashboard_defaut_id]
            del fav["afficher_dashboard"]
    if any("afficher_dashboard" not in f and "dashboard_ids" in f for f in favoris):
        sauvegarder_favoris(source["label"], favoris)
        sauvegarder_dashboards(source["label"], dashboards)

    st.session_state.favoris = favoris
    st.session_state.dashboards = dashboards
    st.session_state.dashboard_actif = dashboards[0]["id"] if dashboards else None
    st.session_state.historique = []
    st.session_state.page = "app"


def _charger_sqlite_si_necessaire():
    """Crée la connexion SQLite en différé, seulement si elle n'existe pas encore."""
    if st.session_state.db_conn is not None:
        return
    sources = charger_sources()
    s = next((src for src in sources if src["label"] == st.session_state.source_label), None)
    if not s:
        return
    source_path = os.path.normpath(s["path"])
    if not os.path.exists(source_path):
        return
    mcd = st.session_state.mcd
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
    for t in mcd["tables"]:
        if t["id"] in tables:
            t["nb_lignes"] = len(tables[t["id"]])
    mcd["generated_at"] = datetime.now().isoformat()
    sauvegarder_mcd(s["label"], mcd)
    with st.spinner("Chargement en base SQLite…"):
        conn = creer_sqlite_en_memoire(tables, mcd)
    st.session_state.db_conn = conn
    st.session_state.mcd = mcd


sources = charger_sources()
if sources and st.session_state.mcd is None and not st.session_state.just_reset:
    # Chargement léger au démarrage : MCD + favoris + dashboards depuis JSON uniquement
    s = sources[0]
    mcd = charger_mcd(s["label"])
    if mcd:
        st.session_state.mcd = mcd
        st.session_state.source_label = s["label"]
        favoris = charger_favoris(s["label"])
        dashboards = charger_dashboards(s["label"])
        st.session_state.favoris = favoris
        st.session_state.dashboards = dashboards
        st.session_state.dashboard_actif = dashboards[0]["id"] if dashboards else None
    else:
        # Aucun MCD en cache : chargement complet nécessaire
        try:
            charger_source(s)
        except Exception as e:
            st.error(f"Erreur chargement source : {e}")


# ─────────────────────────────────────────────────────────────────────────────
# SIDEBAR
# ─────────────────────────────────────────────────────────────────────────────

with st.sidebar:
    col_logo, col_toggle = st.columns([3, 1])
    with col_logo:
        st.markdown("""
        <div class="aria-logo">
            <div class="aria-logo-icon">A</div>
            <div>
                <div class="aria-logo-text">ar<span>.ia</span></div>
                <div class="aria-logo-sub">Votre assistant reporting</div>
            </div>
        </div>
        """, unsafe_allow_html=True)
    with col_toggle:
        theme_options = {"dark": "🌙", "light": "☀️", "deytime": "D"}
        selected = st.selectbox(
            "Thème",
            options=list(theme_options.keys()),
            format_func=lambda x: theme_options[x],
            index=list(theme_options.keys()).index(st.session_state.theme),
            key="theme_select",
            label_visibility="collapsed",
        )
        if selected != st.session_state.theme:
            st.session_state.theme = selected
            st.rerun()

    st.divider()

    if st.session_state.just_reset:
        st.session_state.just_reset = False

    st.markdown('<div class="nav-section">Navigation</div>', unsafe_allow_html=True)
    _p = st.session_state.page
    if st.button("⚙️  Paramètres", use_container_width=True,
                 type="primary" if _p == "parametres" else "secondary"):
        st.session_state.page = "parametres"
        st.rerun()
    if st.button("📌  Dashboards", use_container_width=True,
                 type="primary" if _p == "dashboards" else "secondary"):
        st.session_state.page = "dashboards"
        st.rerun()
    if st.button("💬  Questions", use_container_width=True,
                 type="primary" if _p == "app" else "secondary"):
        st.session_state.page = "app"
        st.rerun()
    if st.button("📧  Mails", use_container_width=True,
                 type="primary" if _p == "emails" else "secondary"):
        st.session_state.page = "emails"
        st.rerun()
    if st.button("❓  Aide", use_container_width=True,
                 type="primary" if _p == "aide" else "secondary"):
        st.session_state.page = "aide"
        st.rerun()

    if st.button("🔴 Déconnexion", use_container_width=True, type="secondary"):
        st.session_state.authenticated = False
        st.session_state.logout_redirect = True
        st.rerun()

    if st.session_state.source_label:
        st.divider()

    st.divider()
    st.markdown('<div class="nav-section">⭐ Favoris</div>', unsafe_allow_html=True)

    if not st.session_state.favoris:
        st.caption("Aucun favori sauvegardé")
    else:
        for i, fav in enumerate(st.session_state.favoris):
            col1, col2 = st.columns([6, 1])
            with col1:
                if st.button(f"▶ {fav['titre'][:35]}", key=f"fav_{i}", use_container_width=True):
                    try:
                        result = executer_sql(st.session_state.db_conn, fav["sql"])
                        fig = generer_graphique_v2(result, fav["viz_config"])
                        commentaire = generer_commentaire_v2(result, fav["viz_config"])
                        st.session_state.historique.insert(0, {
                            "id": str(uuid.uuid4()),
                            "question": f"⭐ {fav['titre']}",
                            "sql": fav["sql"],
                            "viz_config": fav["viz_config"].copy(),
                            "result": result,
                            "fig": fig,
                            "commentaire": commentaire,
                            "ts": datetime.now().strftime("%H:%M"),
                            "fav_titre": fav["titre"],
                        })
                        st.session_state.question_prefill = fav.get("question", "")
                        st.session_state.page = "app"
                        st.rerun()
                    except sqlite3.Error as e:
                        st.error(f"❌ Ce favori contient un SQL invalide : {e}")
                        st.caption("💡 Ce favori a peut-être été créé avec une autre source de données. Supprimez-le ou réexécutez la question originale.")
                        with st.expander("🔍 SQL du favori"):
                            st.code(fav["sql"], language="sql")
                    except Exception as e:
                        st.error(f"❌ Erreur : {e}")
            with col2:
                if st.button("⋯", key=f"opts_fav_{i}", use_container_width=True):
                    current = st.session_state.get(f"editing_fav_{i}", False)
                    st.session_state[f"editing_fav_{i}"] = not current
                    st.rerun()

            if st.session_state.get(f"editing_fav_{i}"):
                nouveau_titre = st.text_input("Renommer", value=fav["titre"], key=f"titre_edit_{i}")
                db_options = {db["id"]: db["nom"] for db in st.session_state.dashboards}
                current_ids = fav.get("dashboard_ids", [])
                selected_ids = [
                    db_id for db_id, db_nom in db_options.items()
                    if st.checkbox(f"📌 {db_nom}", value=db_id in current_ids, key=f"dash_{db_id}_{i}")
                ]
                col_ok, col_del = st.columns(2)
                with col_ok:
                    if st.button("✅", key=f"ok_edit_{i}", use_container_width=True):
                        st.session_state.favoris[i]["titre"] = nouveau_titre
                        st.session_state.favoris[i]["dashboard_ids"] = selected_ids
                        sauvegarder_favoris(st.session_state.source_label, st.session_state.favoris)
                        del st.session_state[f"editing_fav_{i}"]
                        st.rerun()
                with col_del:
                    if st.button("🗑", key=f"del_fav_{i}", use_container_width=True):
                        st.session_state.favoris.pop(i)
                        sauvegarder_favoris(st.session_state.source_label, st.session_state.favoris)
                        st.rerun()


# ─────────────────────────────────────────────────────────────────────────────
# ROUTING
# ─────────────────────────────────────────────────────────────────────────────

if st.session_state.page == "aide":
    afficher_page_aide()
    st.stop()
elif st.session_state.page == "emails":
    _charger_sqlite_si_necessaire()
    afficher_page_emails()
    st.stop()
elif st.session_state.page == "dashboards":
    _charger_sqlite_si_necessaire()
    afficher_page_dashboards()
    st.stop()
elif st.session_state.page == "parametres":
    afficher_page_parametres(charger_source)
    st.stop()


# ─────────────────────────────────────────────────────────────────────────────
# PAGE PRINCIPALE — QUESTIONS
# ─────────────────────────────────────────────────────────────────────────────

if st.session_state.page not in ("app",):
    st.stop()

col_title, col_source = st.columns([2, 1])
with col_title:
    _t = st.session_state.theme
    txt_color  = "#e8eef5" if _t == "dark" else "#1a3030"
    sub_color  = "#7a8fa8" if _t == "dark" else "#4a7068"
    _accent    = "#e8a020" if _t == "deytime" else "#3AA48A"
    st.markdown(f"""
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:4px;">
        <div style="width:42px;height:42px;background:{_accent};border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.3rem;font-weight:900;color:white;font-family:'Plus Jakarta Sans',sans-serif;flex-shrink:0;">A</div>
        <div>
            <div style="font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.6rem;letter-spacing:-0.5px;line-height:1.1;color:{txt_color};">ar<span style="color:{_accent};">.ia</span></div>
            <div style="font-size:0.72rem;letter-spacing:0.8px;text-transform:uppercase;font-weight:500;color:{sub_color};opacity:0.6;">Votre assistant reporting</div>
        </div>
    </div>
    """, unsafe_allow_html=True)
with col_source:
    if st.session_state.source_label:
        label_court = st.session_state.source_label.replace(".xlsx", "").replace(".xls", "")[:22]
        st.markdown(
            f'<div style="text-align:right;padding-top:14px;"><span class="source-badge">📂 {label_court}</span></div>',
            unsafe_allow_html=True
        )

if not st.session_state.mcd:
    st.markdown("""
    <div class="empty-state">
        <div class="empty-state-icon">📂</div>
        <div class="empty-state-title">Chargez votre source de données</div>
        <div class="empty-state-sub">
            Allez dans ⚙️ Paramètres et uploadez un fichier Excel.<br>
            L'IA analyse automatiquement la structure et vous guide.
        </div>
    </div>
    """, unsafe_allow_html=True)

else:
    _charger_sqlite_si_necessaire()
    st.markdown("#### 💬 Posez votre question")

    # Appliquer prefill ou clear AVANT l'instanciation du widget
    if st.session_state.get("clear_input"):
        st.session_state["question_input"] = ""
        st.session_state.clear_input = False
    prefill = st.session_state.get("question_prefill", "")
    if prefill:
        st.session_state["question_input"] = prefill
        st.session_state.question_prefill = ""

    if st.session_state.historique:
        st.caption("💡 Vous pouvez affiner la liste : **ajoute** [un champ] · **enlève** [une colonne] · **trie par** [colonne]")

    with st.form("question_form", clear_on_submit=False):
        question_input = st.text_input(
            "Votre question",
            placeholder="Ex : Quels employés ont le plus d'heures ce mois ?",
            key="question_input",
            label_visibility="collapsed"
        )
        col_ask, col_clear = st.columns([5, 1])
        with col_ask:
            ask_clicked = st.form_submit_button("🔍 Analyser", use_container_width=True)
        with col_clear:
            clear_clicked = st.form_submit_button("✕ Effacer", use_container_width=True)

    if clear_clicked:
        st.session_state.historique = []
        st.session_state.question_prefill = ""
        st.session_state.clear_input = True
        st.rerun()

    if ask_clicked and question_input.strip():
        question_norm = question_input.strip()
        historique = st.session_state.historique
        est_modif = est_modification(question_norm) and len(historique) > 0

        # ── Forcer est_modif=True pour tout tri détecté dans la phrase ──────────
        _is_sort = bool(_MOD_SORT_SEARCH.search(question_norm)) and len(historique) > 0
        if _is_sort and not est_modif:
            est_modif = True


        # ── Tri Python direct (sans LLM) ─────────────────────────────────────────
        # Chercher dans l'historique l'item le plus récent qui contient la colonne
        # mentionnée dans la question (pas forcément historique[0]).
        if _is_sort and len(historique) > 0:
            try:
                _cible_idx = None
                _tri_result = None
                for _hi, _item in enumerate(historique):
                    _r = _tri_python(question_norm, _item["result"], _item["viz_config"])
                    if _r is not None:
                        _cible_idx = _hi
                        _tri_result = _r
                        break
                if _tri_result is not None and _cible_idx is not None:
                    _sorted_df, _sort_col, _sort_asc = _tri_result
                    _vc_render = {**historique[_cible_idx]["viz_config"], "show_total_col": False}
                    _fig = generer_graphique_v2(_sorted_df, _vc_render)
                    _comm = generer_commentaire_v2(_sorted_df, _vc_render)
                    # Mettre à jour l'item cible et le remonter en position 0
                    historique[_cible_idx].update({
                        "result": _sorted_df,
                        "viz_config": _vc_render,
                        "fig": _fig,
                        "commentaire": _comm,
                        "ts": datetime.now().strftime("%H:%M"),
                    })
                    if _cible_idx != 0:
                        historique.insert(0, historique.pop(_cible_idx))
                    st.rerun()
            except Exception:
                pass  # fallback vers modifier_sql ci-dessous

        # ── Ajout de colonne Python direct (sans LLM) ────────────────────────
        _is_add = bool(_MOD_ADD_SEARCH.search(question_norm)) and est_modif and len(historique) > 0
        if _is_add:
            try:
                _dernier = historique[0]
                _add_viz = _ajouter_colonne_python(
                    question_norm, _dernier["sql"], _dernier["viz_config"], st.session_state.mcd
                )
                if _add_viz is not None:
                    _add_sql = _add_viz["sql"]
                    _add_result = executer_sql(st.session_state.db_conn, _add_sql)
                    _add_fig  = generer_graphique_v2(_add_result, _add_viz)
                    _add_comm = generer_commentaire_v2(_add_result, _add_viz)
                    historique[0].update({
                        "sql": _add_sql, "viz_config": _add_viz,
                        "result": _add_result, "fig": _add_fig,
                        "commentaire": _add_comm,
                        "ts": datetime.now().strftime("%H:%M"),
                    })
                    st.rerun()
            except Exception:
                pass  # fallback vers modifier_sql ci-dessous

        spinner_label = "✏️ Modification en cours…" if est_modif else "🤖 Génération SQL en cours…"
        with st.spinner(spinner_label):
            try:
                if est_modif:
                    dernier = historique[0]
                    viz_config = modifier_sql(
                        question_norm,
                        dernier["sql"],
                        dernier["viz_config"],
                        st.session_state.mcd,
                    )
                    # Filet de sécurité : propager les flags de total si le LLM ne les a pas retournés.
                    # On ne propage PAS si le LLM les a explicitement mis à false (suppression voulue).
                    for _flag in ("show_total", "show_total_col"):
                        if dernier["viz_config"].get(_flag) and _flag not in viz_config:
                            viz_config[_flag] = True
                    # Préserver type_viz : une modification ne doit jamais changer le type de graphique
                    viz_config["type_viz"] = dernier["viz_config"].get("type_viz", viz_config.get("type_viz"))
                    # Préserver unite : si le LLM ne le retourne pas ou retourne null, garder l'unité précédente
                    if not viz_config.get("unite") and dernier["viz_config"].get("unite"):
                        viz_config["unite"] = dernier["viz_config"]["unite"]
                else:
                    viz_config = question_vers_sql(question_norm, st.session_state.mcd)
                sql = viz_config.get("sql", "")
                try:
                    result = executer_sql(st.session_state.db_conn, sql)
                except sqlite3.Error as e:
                    erreur_initiale = str(e)
                    with st.spinner("⚠️ Erreur SQL détectée — tentative de correction automatique…"):
                        try:
                            viz_config = corriger_sql(
                                question_input, st.session_state.mcd, sql, erreur_initiale
                            )
                            sql = viz_config.get("sql", "")
                            result = executer_sql(st.session_state.db_conn, sql)
                            st.info("✅ SQL corrigé automatiquement par l'IA.")
                        except sqlite3.Error as e2:
                            st.error(f"❌ Erreur SQL persistante après correction : {e2}")
                            with st.expander("🔍 Détail des tentatives SQL"):
                                st.caption("SQL initial (échoué) :")
                                st.code(viz_config.get("sql", sql), language="sql")
                                st.caption(f"Erreur initiale : {erreur_initiale}")
                                st.caption(f"Erreur après correction : {e2}")
                            raise
                # Normaliser show_total_col : pas de colonne Total si aucune mesure numérique
                if viz_config.get("show_total_col"):
                    if result.select_dtypes(include="number").empty:
                        viz_config["show_total_col"] = False
                fig = generer_graphique_v2(result, viz_config)
                commentaire = generer_commentaire_v2(result, viz_config)
                if est_modif:
                    # Mise à jour en place : on améliore le graphique existant sans créer une nouvelle entrée
                    st.session_state.historique[0].update({
                        "sql": sql,
                        "viz_config": viz_config,
                        "result": result,
                        "fig": fig,
                        "commentaire": commentaire,
                        "ts": datetime.now().strftime("%H:%M"),
                    })
                else:
                    st.session_state.historique.insert(0, {
                        "id": str(uuid.uuid4()),
                        "question": question_input,
                        "sql": sql,
                        "viz_config": viz_config,
                        "result": result,
                        "fig": fig,
                        "commentaire": commentaire,
                        "ts": datetime.now().strftime("%H:%M"),
                    })
            except json.JSONDecodeError:
                if est_modif:
                    st.error("❌ L'IA n'a pas pu appliquer la modification. Précisez le nom exact du champ.")
                else:
                    st.error("❌ L'IA n'a pas retourné un JSON valide. Reformulez la question.")
            except sqlite3.Error:
                pass  # déjà affiché ci-dessus
            except Exception as e:
                _msg = str(e)
                if "insufficient_quota" in _msg or "429" in _msg or "credit" in _msg.lower():
                    st.error("❌ Quota OpenAI épuisé — rechargez vos crédits sur platform.openai.com")
                elif "401" in _msg or "invalid_api_key" in _msg or "authentication" in _msg.lower() or "api_key" in _msg.lower():
                    st.error("❌ Clé API OpenAI invalide ou absente — vérifiez la variable d'environnement OPENAI_API_KEY")
                elif "503" in _msg or "502" in _msg or "overloaded" in _msg:
                    st.error("❌ OpenAI indisponible momentanément — réessayez dans quelques secondes")
                else:
                    st.error(f"❌ Erreur inattendue : {e}")

    st.divider()

    if st.session_state.historique:
        for idx, item in enumerate(st.session_state.historique):
            with st.container():
                col_q, col_ts = st.columns([5, 1])
                with col_q:
                    st.markdown(f"**{item['question']}**")
                with col_ts:
                    st.caption(item["ts"])

                # ── Rendu : graphique + panneau analyse (toggle) ──────────────
                type_viz = item["viz_config"].get("type_viz")
                cols_a_cacher = [c for c in item["result"].columns if c.startswith("__")]
                df_display = item["result"].drop(columns=cols_a_cacher, errors="ignore")

                _panel_key = f"panel_open_{idx}"
                if _panel_key not in st.session_state:
                    st.session_state[_panel_key] = False

                if st.session_state[_panel_key]:
                    col_viz, col_btn, col_comment = st.columns([3, 0.15, 1.2])
                else:
                    col_viz, col_btn = st.columns([20, 1])
                    col_comment = None

                with col_viz:
                    if type_viz == "fiche":
                        st.markdown(generer_fiche_html(item["result"], item["viz_config"]), unsafe_allow_html=True)
                    else:
                        fig = generer_graphique_v2(item["result"], item["viz_config"])
                        st.plotly_chart(fig, use_container_width=True, key=f"chart_{idx}")

                with col_btn:
                    st.write("")
                    _arrow = "▶" if st.session_state[_panel_key] else "◀"
                    if st.button(_arrow, key=f"toggle_panel_{idx}"):
                        st.session_state[_panel_key] = not st.session_state[_panel_key]
                        st.rerun()

                if col_comment is not None:
                    with col_comment:
                        st.markdown("**📝 Analyse**")
                        if item.get("commentaire"):
                            st.markdown(item["commentaire"])
                        st.divider()
                        comment_key = f"comment_{idx}"
                        if comment_key not in st.session_state:
                            st.session_state[comment_key] = item.get("commentaire_panel", "")
                        st.text_area("", key=comment_key, height=120,
                                     label_visibility="collapsed",
                                     placeholder="Vos notes…")
                        item["commentaire_panel"] = st.session_state[comment_key]

                # ── Boutons d'action ──────────────────────────────────────────
                col_fav, col_xlsx, col_delete, col_sql_exp = st.columns([3, 1.5, 1.2, 2])

                with col_fav:
                    titre_fav = (item["viz_config"].get("titre") or item["question"] or "")[:40]
                    # Si le graphique vient d'un favori, le retrouver par son titre d'origine (fav_titre)
                    # même si le titre a changé après modification
                    _fav_key = item.get("fav_titre") or titre_fav
                    fav_existant = next((f for f in st.session_state.favoris if f["titre"] == _fav_key), None)
                    if fav_existant:
                        if st.button("🔄 Enregistrer dans les favoris", key=f"save_fav_{idx}", use_container_width=True):
                            fav_existant["sql"] = item["sql"]
                            fav_existant["viz_config"] = item["viz_config"].copy()
                            fav_existant["saved_at"] = datetime.now().strftime("%d/%m %H:%M")
                            sauvegarder_favoris(st.session_state.source_label, st.session_state.favoris)
                            st.success("✅ Favori mis à jour !")
                            st.rerun()
                    else:
                        if st.button("⭐ Enregistrer dans les favoris", key=f"save_fav_{idx}", use_container_width=True):
                            st.session_state.favoris.append({
                                "titre": titre_fav,
                                "question": item["question"],
                                "sql": item["sql"],
                                "viz_config": item["viz_config"].copy(),
                                "saved_at": datetime.now().strftime("%d/%m %H:%M"),
                                "dashboard_ids": [],
                            })
                            sauvegarder_favoris(st.session_state.source_label, st.session_state.favoris)
                            # Fermer tout mode édition ouvert pour éviter qu'un état résiduel s'applique au nouvel index
                            for k in [k for k in st.session_state if k.startswith("editing_fav_")]:
                                del st.session_state[k]
                            st.success("✅ Favori ajouté !")
                            st.rerun()

                with col_xlsx:
                    if not df_display.empty:
                        buf = io.BytesIO()
                        titre_raw = (item["viz_config"].get("titre") or item["question"] or "Export")
                        titre_xlsx = re.sub(r'[:\\/\?\*\[\]]', '-', titre_raw)[:31]
                        with pd.ExcelWriter(buf, engine="openpyxl") as writer:
                            df_display.to_excel(writer, index=False, sheet_name=titre_xlsx or "Export")
                        st.download_button(
                            label="⬇ Export Excel",
                            data=buf.getvalue(),
                            file_name=f"{titre_xlsx or 'export'}.xlsx",
                            mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                            key=f"xlsx_{idx}",
                            use_container_width=True,
                        )

                with col_delete:
                    if st.button("🗑 Effacer", key=f"delete_chart_{idx}", use_container_width=True):
                        st.session_state.historique.pop(idx)
                        st.rerun()

                with col_sql_exp:
                    with st.expander("🔧 SQL généré"):
                        st.code(item["sql"], language="sql", wrap_lines=True)

                st.divider()

    else:
        st.markdown("""
        <div class="empty-state" style="padding: 2rem;">
            <div class="empty-state-icon">💬</div>
            <div class="empty-state-title">Prêt à analyser</div>
            <div class="empty-state-sub">Source chargée — posez votre première question ci-dessus</div>
        </div>
        """, unsafe_allow_html=True)
