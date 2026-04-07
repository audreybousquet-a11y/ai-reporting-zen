"""
ui_emails.py — Page Emails / Broadcast commercial
"""

import base64
import io
import smtplib
import ssl
import uuid
from email.mime.image import MIMEImage
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import openai
import streamlit as st
import streamlit.components.v1 as components

from db import executer_sql
from viz import generer_graphique_v2
from persistence import (charger_email_config, sauvegarder_email_config,
                         charger_email_modeles, sauvegarder_email_modeles)


# ─── DONNÉES FICTIVES POUR LA MAQUETTE ───────────────────────────────────────

_MODELES_DEMO = [
    {"id": "m1", "nom": "Bilan hebdo commerciaux", "objet": "📊 Point hebdo – semaine {semaine}"},
    {"id": "m2", "nom": "Objectifs fin de mois",   "objet": "🎯 Objectifs avril – où en sommes-nous ?"},
]

_BLOCS_TYPES = {
    "texte":     {"label": "✏️ Texte libre",          "icone": "✏️"},
    "kpi":       {"label": "🔢 KPI (chiffre clé)",    "icone": "🔢"},
    "tableau":   {"label": "📋 Tableau favori",       "icone": "📋"},
    "graphique": {"label": "📊 Graphique favori",     "icone": "📊"},
    "ia":        {"label": "🤖 Phrase IA (résumé)",   "icone": "🤖"},
}

_FREQUENCES = ["Manuel uniquement", "Hebdomadaire", "Mensuelle", "Bi-mensuelle"]
_JOURS_SEMAINE = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"]
_JOURS_MOIS = [str(i) for i in range(1, 29)]


# ─── INIT SESSION STATE ───────────────────────────────────────────────────────

def _sauvegarder_modeles():
    sauvegarder_email_modeles({
        "modeles":       st.session_state.email_modeles,
        "blocs":         st.session_state.email_blocs,
        "planif":        st.session_state.email_planif,
        "destinataires": st.session_state.email_destinataires,
    })


def _init_email_state():
    if "email_modeles" not in st.session_state:
        data = charger_email_modeles()
        if data:
            st.session_state.email_modeles       = data.get("modeles", [])
            st.session_state.email_blocs         = data.get("blocs", {})
            st.session_state.email_planif        = data.get("planif", {})
            st.session_state.email_destinataires = data.get("destinataires", {})
        else:
            st.session_state.email_modeles       = []
            st.session_state.email_blocs         = {}
            st.session_state.email_planif        = {}
            st.session_state.email_destinataires = {}
    if "email_modele_actif" not in st.session_state:
        st.session_state.email_modele_actif = (
            st.session_state.email_modeles[0]["id"]
            if st.session_state.email_modeles else None
        )
    if "email_smtp_expanded" not in st.session_state:
        st.session_state.email_smtp_expanded = False
    if "email_smtp_loaded" not in st.session_state:
        cfg = charger_email_config()
        for key in ("smtp_provider", "smtp_host", "smtp_port", "smtp_login",
                    "smtp_password", "smtp_display_name"):
            if key in cfg:
                st.session_state[key] = cfg[key]
        st.session_state.email_smtp_loaded = True


# ─── RENDU APERÇU EMAIL ───────────────────────────────────────────────────────

def _apercu_email(blocs: list, objet: str):
    """Rendu HTML simplifié de l'aperçu dans Streamlit — couleurs adaptées au thème."""
    _theme      = st.session_state.get("theme", "dark")
    _accent     = "#e8a020" if _theme == "deytime" else "#3AA48A"
    _accent_bg  = "#fff3d0" if _theme == "deytime" else "#f0f7f5"
    _accent_dim = "#e8a02055" if _theme == "deytime" else "#3AA48A55"
    _is_dark    = _theme == "dark"
    _text_main  = "#ffffff" if _is_dark else "#2d3748"
    _text_muted = "#a0aec0" if _is_dark else "#718096"
    _card_bg    = "#1c2530" if _is_dark else "#ffffff"

    st.markdown(
        f"<span style='font-size:0.8rem;color:#a0aec0;text-transform:uppercase;letter-spacing:0.5px;'>Objet</span>"
        f"<br><span style='font-weight:700;color:{_accent};font-size:1rem;'>{objet or '—'}</span>",
        unsafe_allow_html=True
    )
    st.divider()
    for bloc in blocs:
        t = bloc["type"]
        if t == "texte":
            for ligne in bloc.get("contenu", "").split("\n"):
                st.markdown(
                    f"<p style='margin:3px 0;font-size:14px;color:{_text_main};'>{ligne if ligne.strip() else '&nbsp;'}</p>",
                    unsafe_allow_html=True
                )
        elif t == "kpi":
            label   = bloc.get("label", "KPI")
            symbole = bloc.get("symbole", "€")
            st.markdown(f"""
            <div style="background:{_accent_bg};border-left:4px solid {_accent};
                border-radius:8px;padding:12px 16px;margin:8px 0;">
                <div style="font-size:0.72rem;color:{_text_muted};text-transform:uppercase;letter-spacing:0.5px;">{label}</div>
                <div style="font-size:1.8rem;font-weight:800;color:{_accent};">— {symbole}</div>
                <div style="font-size:0.68rem;color:#a0aec0;font-style:italic;">Valeur chargée à l'envoi</div>
            </div>""", unsafe_allow_html=True)
        elif t == "tableau":
            label = bloc.get("label", "Tableau")
            fav   = bloc.get("favori_id") or "—"
            st.markdown(f"""
            <div style="background:{_card_bg};border:1px solid {_accent_dim};
                border-radius:8px;padding:12px 16px;margin:8px 0;text-align:center;">
                <div style="font-size:0.8rem;color:{_text_main};font-weight:600;">📋 {label}</div>
                <div style="color:{_text_muted};font-size:0.7rem;margin-top:4px;font-style:italic;">Favori : {fav}</div>
            </div>""", unsafe_allow_html=True)
        elif t == "graphique":
            label = bloc.get("label", "Graphique")
            fav   = bloc.get("favori_id") or "—"
            st.markdown(f"""
            <div style="background:{_card_bg};border:2px dashed {_accent};
                border-radius:8px;padding:20px 16px;margin:8px 0;text-align:center;">
                <div style="font-size:1.6rem;">📊</div>
                <div style="font-size:0.8rem;color:{_text_main};font-weight:600;">{label}</div>
                <div style="color:{_text_muted};font-size:0.7rem;margin-top:4px;font-style:italic;">Favori : {fav}</div>
            </div>""", unsafe_allow_html=True)
        elif t == "ia":
            contenu = bloc.get("contenu", "")
            st.markdown(f"""
            <div style="background:{_accent_bg};border:1px solid {_accent_dim};
                border-radius:8px;padding:12px 16px;margin:8px 0;">
                <div style="font-size:0.7rem;color:{_accent};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">🤖 Analyse IA</div>
                <div style="color:{_text_main};font-style:italic;font-size:0.85rem;">{contenu if contenu else 'Instruction à renseigner…'}</div>
            </div>""", unsafe_allow_html=True)


# ─── ÉDITEUR DE BLOCS ─────────────────────────────────────────────────────────

def _editeur_blocs(modele_id: str):
    blocs = st.session_state.email_blocs.get(modele_id, [])
    favoris = st.session_state.get("favoris", [])
    fav_options = ["(aucun)"] + [f["titre"] for f in favoris]

    # Forcer la couleur des boutons ▲/▼/✏️/🗑 en light et deytime
    _theme = st.session_state.get("theme", "dark")
    if _theme != "dark":
        _accent      = "#e8a020" if _theme == "deytime" else "#3AA48A"
        _accent_soft = "#f5d080" if _theme == "deytime" else "#a8ddd0"
        _border_color = "#e8a020" if _theme == "deytime" else "#3AA48A"
        components.html(f"""
        <script>
        (function() {{
            var ARROW       = ['\u25b2', '\u25bc'];
            var ACTION_CP   = [0x1F5D1, 0x1F522, 0x1F4CB, 0x1F4CA, 0x1F916, 0x1F9EA];
            var ACTION_STR  = ACTION_CP.map(function(cp){{ return String.fromCodePoint(cp); }});
            var PENCIL      = '\u270f';
            function isAction(txt) {{
                if (txt.includes(PENCIL)) return true;
                return ACTION_STR.some(function(s){{ return txt.includes(s); }});
            }}
            function styleAll() {{
                var doc = window.parent.document;
                doc.querySelectorAll('[data-testid="stButton"] button').forEach(function(btn) {{
                    var txt = btn.textContent.trim();
                    if (ARROW.some(function(c){{ return txt === c; }})) {{
                        btn.style.setProperty('background', '{_accent}', 'important');
                        btn.style.setProperty('color', '#fff', 'important');
                        btn.style.setProperty('border', 'none', 'important');
                        btn.style.setProperty('border-radius', '4px', 'important');
                    }} else if (isAction(txt)) {{
                        btn.style.setProperty('background', '{_accent_soft}', 'important');
                        btn.style.setProperty('color', '#7a4a00', 'important');
                        btn.style.setProperty('border', 'none', 'important');
                        btn.style.setProperty('border-radius', '4px', 'important');
                    }}
                }});
                doc.querySelectorAll('[data-testid="stVerticalBlockBorderWrapper"]').forEach(function(el) {{
                    el.style.setProperty('border', '2px solid {_border_color}', 'important');
                    el.style.setProperty('border-radius', '12px', 'important');
                    el.style.setProperty('background', '#ffffff', 'important');
                }});
            }}
            styleAll();
            new MutationObserver(styleAll).observe(
                window.parent.document.body, {{childList: true, subtree: true}}
            );
        }})();
        </script>
        """, height=0)

    if not blocs:
        st.caption("Aucun bloc — ajoutez-en un ci-dessous.")

    for idx, bloc in enumerate(blocs):
        t = bloc["type"]
        icone = _BLOCS_TYPES[t]["icone"]
        label_type = _BLOCS_TYPES[t]["label"]

        with st.container(border=True):
            col_type, col_up, col_dn, col_del = st.columns([5, 1, 1, 1])
            with col_type:
                st.markdown(f"**{icone} {label_type}**")
            with col_up:
                if st.button("▲", key=f"up_bloc_{modele_id}_{idx}", disabled=(idx == 0),
                             help="Monter", use_container_width=True):
                    blocs[idx], blocs[idx - 1] = blocs[idx - 1], blocs[idx]
                    _sauvegarder_modeles()
                    st.rerun()
            with col_dn:
                if st.button("▼", key=f"dn_bloc_{modele_id}_{idx}", disabled=(idx == len(blocs) - 1),
                             help="Descendre", use_container_width=True):
                    blocs[idx], blocs[idx + 1] = blocs[idx + 1], blocs[idx]
                    _sauvegarder_modeles()
                    st.rerun()
            with col_del:
                if st.button("🗑", key=f"del_bloc_{modele_id}_{idx}",
                             help="Supprimer", use_container_width=True):
                    blocs.pop(idx)
                    _sauvegarder_modeles()
                    st.rerun()

            # ── Contenu selon le type ──
            if t == "texte":
                nouveau = st.text_area(
                    "Contenu",
                    value=bloc.get("contenu", ""),
                    height=100,
                    key=f"txt_{modele_id}_{idx}",
                    label_visibility="collapsed",
                    placeholder="Tapez votre texte ici…",
                )
                bloc["contenu"] = nouveau

            elif t in ("kpi", "tableau", "graphique"):
                cols = st.columns([3, 2, 1]) if t == "kpi" else st.columns([3, 3])
                with cols[0]:
                    bloc["label"] = st.text_input(
                        "Titre affiché",
                        value=bloc.get("label", ""),
                        key=f"lbl_{modele_id}_{idx}",
                        placeholder="Ex : Piscines vendues ce mois",
                    )
                with cols[1]:
                    if favoris:
                        current = bloc.get("favori_id")
                        current_idx = fav_options.index(current) if current in fav_options else 0
                        sel = st.selectbox(
                            "Favori source",
                            options=fav_options,
                            index=current_idx,
                            key=f"fav_{modele_id}_{idx}",
                        )
                        new_fav = sel if sel != "(aucun)" else None
                        if new_fav != bloc.get("favori_id"):
                            bloc["favori_id"] = new_fav
                            _sauvegarder_modeles()
                        else:
                            bloc["favori_id"] = new_fav
                    else:
                        st.caption("_Aucun favori disponible — créez-en dans l'onglet Questions_")
                if t == "kpi":
                    with cols[2]:
                        bloc["symbole"] = st.text_input(
                            "Symbole",
                            value=bloc.get("symbole", "€"),
                            key=f"sym_{modele_id}_{idx}",
                            placeholder="€",
                        )

            elif t == "ia":
                bloc["contenu"] = st.text_area(
                    "Instruction pour l'IA",
                    value=bloc.get("contenu", ""),
                    height=100,
                    key=f"ia_{modele_id}_{idx}",
                    label_visibility="collapsed",
                    placeholder="Ex : Compare le CA du mois en cours avec les mois précédents et conclus en une phrase d'encouragement ou de vigilance.",
                )

    st.divider()
    # ── Ajouter un bloc ──
    st.markdown("**Ajouter un bloc**")
    st.markdown("""<style>
div[class*="st-key-add_texte"] button,
div[class*="st-key-add_kpi"] button,
div[class*="st-key-add_tableau"] button,
div[class*="st-key-add_graphique"] button,
div[class*="st-key-add_ia"] button {
    min-height: 56px !important;
    white-space: normal !important;
    line-height: 1.3 !important;
}
</style>""", unsafe_allow_html=True)
    cols_add = st.columns(len(_BLOCS_TYPES))
    for i, (type_key, meta) in enumerate(_BLOCS_TYPES.items()):
        with cols_add[i]:
            if st.button(meta["label"], key=f"add_{type_key}_{modele_id}", use_container_width=True):
                new_bloc = {"id": uuid.uuid4().hex[:6], "type": type_key}
                if type_key == "texte":
                    new_bloc["contenu"] = ""
                elif type_key == "ia":
                    new_bloc["contenu"] = ""
                else:
                    new_bloc["label"] = ""
                    new_bloc["favori_id"] = None
                blocs.append(new_bloc)
                _sauvegarder_modeles()
                st.rerun()


# ─── CONSTRUCTION HTML DE L'EMAIL ────────────────────────────────────────────

def _fig_to_base64_png(fig) -> str:
    """Exporte une figure Plotly en PNG base64."""
    buf = io.BytesIO()
    fig.write_image(buf, format="png", width=580, height=320, scale=2)
    return base64.b64encode(buf.getvalue()).decode()


def _formater_kpi(valeur, symbole: str = "") -> str:
    """Formate un nombre en style français : 1 234 567,89 €"""
    try:
        n = float(str(valeur).replace(" ", "").replace(",", ".").replace("\xa0", ""))
        # Partie entière avec séparateur espace, partie décimale avec virgule
        if n == int(n):
            txt = f"{int(n):,}".replace(",", "\u202f")          # entier sans décimales
        else:
            txt = f"{n:,.2f}".replace(",", "\u202f").replace(".", ",")  # 1 234,56
        return f"{txt} {symbole}".strip() if symbole else txt
    except (ValueError, TypeError):
        return str(valeur)


_COLS_MONETAIRES = {"ca", "chiffre", "montant", "prix", "total", "recette",
                    "revenu", "marge", "budget", "cout", "coût", "vente"}


def _formater_cellule(val, col_name: str) -> str:
    """Formate une valeur de cellule : nombre → style français, texte → tel quel."""
    import pandas as pd
    if pd.isna(val):
        return "—"
    try:
        n = float(val)
        col_lower = str(col_name).lower()
        est_monetaire = any(k in col_lower for k in _COLS_MONETAIRES)
        symbole = "€" if est_monetaire else ""
        return _formater_kpi(n, symbole)
    except (ValueError, TypeError):
        return str(val)


def _df_to_html_table(df) -> str:
    """Convertit un DataFrame en tableau HTML stylisé pour email."""
    th_style = (
        "background:#3AA48A;color:#ffffff;padding:8px 10px;text-align:left;"
        "font-size:12px;border-bottom:2px solid #2d8f78;word-wrap:break-word;"
    )
    td_style_base = (
        "padding:6px 10px;font-size:12px;color:#2d3748;"
        "border-bottom:1px solid #e2e8f0;word-wrap:break-word;"
    )
    tr_alt  = "background:#f0f7f5;"
    tr_norm = "background:#ffffff;"

    import pandas as pd
    nb_cols = len(df.columns)
    col_pct = int(100 / nb_cols) if nb_cols else 100

    headers = "".join(
        f"<th style='{th_style}width:{col_pct}%;'>{col}</th>"
        for col in df.columns
    )
    rows = ""
    for i, (_, row) in enumerate(df.iterrows()):
        bg = tr_alt if i % 2 else tr_norm
        cells = ""
        for col, val in zip(df.columns, row):
            # Aligner à droite si numérique
            is_num = pd.api.types.is_numeric_dtype(df[col])
            align = "text-align:right;" if is_num else ""
            cells += f"<td style='{td_style_base}{align}'>{_formater_cellule(val, col)}</td>"
        rows += f"<tr style='{bg}'>{cells}</tr>"

    return (
        f"<table style='border-collapse:collapse;width:100%;table-layout:fixed;'>"
        f"<thead><tr>{headers}</tr></thead>"
        f"<tbody>{rows}</tbody></table>"
    )


def _appeler_ia_resume(instruction: str, contexte_csv: str) -> str:
    """Appelle Claude pour générer un texte de résumé à partir des données."""
    client = openai.OpenAI()
    msg = client.chat.completions.create(
        model="gpt-4o",
        max_tokens=200,
        messages=[
            {"role": "system", "content": (
                "Tu es intégré dans un email de reporting commercial. "
                "Tu reçois des données et une instruction. Tu l'exécutes sans jamais en faire plus. "
                "RÈGLES NON NÉGOCIABLES : "
                "— Si l'instruction dit 'une phrase' : tu écris exactement une phrase, point final. "
                "— Si l'instruction dit 'pas d'analyse' : zéro analyse, même partielle. "
                "— Tu ne cites jamais de chiffres sauf si l'instruction le demande. "
                "— Pas de titre, pas de formule d'introduction, pas de markdown. "
                "— Français uniquement."
            )},
            {"role": "user", "content": (
                f"Données :\n{contexte_csv}\n\n"
                f"Instruction : {instruction}"
            )},
        ],
    )
    return msg.choices[0].message.content.strip()


def _construire_html_email(blocs: list, erreurs: list) -> tuple[str, dict]:
    """
    Génère le corps HTML complet de l'email.
    Retourne (html, images) où images = {cid: bytes_png}.
    Les erreurs rencontrées sont ajoutées dans la liste erreurs (in-place).
    """
    favoris = st.session_state.get("favoris", [])
    db_conn = st.session_state.get("db_conn")
    images: dict[str, bytes] = {}  # cid → bytes PNG

    def _trouver_favori(titre: str):
        return next((f for f in favoris if f["titre"] == titre), None)

    sections_html = []

    for bloc in blocs:
        t = bloc["type"]

        # ── Texte libre ──────────────────────────────────────────────────────
        if t == "texte":
            contenu = bloc.get("contenu", "")
            lignes_html = "".join(
                f"<p style='margin:4px 0;color:#2d3748;font-size:14px;line-height:1.6;'>{l if l.strip() else '&nbsp;'}</p>"
                for l in contenu.split("\n")
            )
            sections_html.append(lignes_html)

        # ── KPI ───────────────────────────────────────────────────────────────
        elif t == "kpi":
            label    = bloc.get("label", "KPI")
            symbole  = bloc.get("symbole", "")
            favori_titre = bloc.get("favori_id")
            valeur = "—"
            if favori_titre and db_conn:
                fav = _trouver_favori(favori_titre)
                if fav:
                    try:
                        df = executer_sql(db_conn, fav["sql"])
                        if not df.empty:
                            valeur = _formater_kpi(df.iloc[0, 0], symbole)
                    except Exception as e:
                        erreurs.append(f"KPI « {label} » : {e}")
            sections_html.append(f"""
            <div style="background:#f0f7f5;border-left:4px solid #3AA48A;border-radius:8px;padding:14px 18px;margin:12px 0;">
                <div style="font-size:11px;color:#718096;text-transform:uppercase;letter-spacing:0.5px;">{label}</div>
                <div style="font-size:2.2rem;font-weight:800;color:#3AA48A;line-height:1.2;">{valeur}</div>
            </div>""")

        # ── Tableau ───────────────────────────────────────────────────────────
        elif t == "tableau":
            label = bloc.get("label", "Tableau")
            favori_titre = bloc.get("favori_id")
            contenu_table = f"<p style='color:#a0aec0;font-style:italic;'>Aucun favori sélectionné pour « {label} »</p>"
            if favori_titre and db_conn:
                fav = _trouver_favori(favori_titre)
                if fav:
                    try:
                        df = executer_sql(db_conn, fav["sql"])
                        contenu_table = _df_to_html_table(df)
                    except Exception as e:
                        erreurs.append(f"Tableau « {label} » : {e}")
            sections_html.append(f"""
            <div style="margin:12px 0;">
                <div style="font-size:12px;color:#718096;margin-bottom:6px;font-weight:600;">{label}</div>
                {contenu_table}
            </div>""")

        # ── Graphique ─────────────────────────────────────────────────────────
        elif t == "graphique":
            label = bloc.get("label", "Graphique")
            favori_titre = bloc.get("favori_id")
            if favori_titre and db_conn:
                fav = _trouver_favori(favori_titre)
                if fav:
                    if fav["viz_config"].get("type_viz") == "fiche":
                        erreurs.append(f"Graphique « {label} » : le favori sélectionné est une fiche, pas un graphique. Choisissez un favori de type bar, line, pie…")
                    else:
                        try:
                            df  = executer_sql(db_conn, fav["sql"])
                            fig = generer_graphique_v2(df, fav["viz_config"])
                            fig.update_layout(
                                paper_bgcolor="#ffffff",
                                plot_bgcolor="#ffffff",
                                font_color="#2d3748",
                            )
                            buf = io.BytesIO()
                            fig.write_image(buf, format="png", width=580, height=320, scale=2)
                            img_bytes = buf.getvalue()
                            cid = f"graph_{uuid.uuid4().hex[:8]}"
                            images[cid] = img_bytes
                            sections_html.append(f"""
                            <div style="margin:12px 0;">
                                <div style="font-size:12px;color:#718096;margin-bottom:6px;font-weight:600;">{label}</div>
                                <img src="cid:{cid}" style="width:100%;border-radius:8px;" alt="{label}">
                            </div>""")
                            continue
                        except Exception as e:
                            erreurs.append(f"Graphique « {label} » : {e}")
            sections_html.append(f"<p style='color:#a0aec0;font-style:italic;'>Graphique « {label} » — aucune donnée disponible</p>")

        # ── Phrase IA ─────────────────────────────────────────────────────────
        elif t == "ia":
            instruction = bloc.get("contenu", "")
            from datetime import date
            aujourd_hui = date.today().strftime("%d/%m/%Y")
            mois_en_cours = date.today().strftime("%B %Y")

            # Collecter TOUS les favoris de tous les blocs avec leur rôle
            contextes = [f"Date du jour : {aujourd_hui} (mois en cours : {mois_en_cours})"]
            for b in blocs:
                if b.get("favori_id") and db_conn:
                    fav = _trouver_favori(b["favori_id"])
                    if fav:
                        try:
                            df = executer_sql(db_conn, fav["sql"])
                            csv = df.head(100).to_csv(index=False)
                            type_bloc = b.get("type", "")
                            role = {
                                "kpi":      "Valeur du mois en cours",
                                "tableau":  "Données historiques",
                                "graphique":"Données historiques",
                            }.get(type_bloc, "Données")
                            label = b.get("label") or fav["titre"]
                            contextes.append(f"### {label} ({role})\n{csv}")
                        except Exception:
                            pass
            contexte_csv = "\n\n".join(contextes)
            try:
                texte_ia = _appeler_ia_resume(instruction, contexte_csv)
            except Exception as e:
                texte_ia = f"[Erreur IA : {e}]"
                erreurs.append(f"Bloc IA : {e}")
            sections_html.append(f"""
            <div style="background:#f0f7f5;border:1px solid #3AA48A55;border-radius:8px;padding:12px 16px;margin:12px 0;">
                <div style="font-size:10px;color:#3AA48A;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Analyse</div>
                <div style="color:#4a5568;font-style:italic;font-size:14px;line-height:1.6;">{texte_ia}</div>
            </div>""")

    corps = "\n".join(sections_html)
    html = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;">
    <tr><td align="center" style="padding:32px 16px;">
      <table width="600" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
        <tr>
          <td style="background:#3AA48A;padding:18px 28px;">
            <span style="font-size:1.3rem;font-weight:800;color:#fff;letter-spacing:-0.5px;">ar<span style="opacity:0.8;">.ia</span></span>
            <span style="color:#ffffffaa;font-size:0.8rem;margin-left:12px;">Reporting commercial</span>
          </td>
        </tr>
        <tr>
          <td style="padding:28px;">
            {corps}
          </td>
        </tr>
        <tr>
          <td style="padding:14px 28px;background:#f7fafc;font-size:11px;color:#a0aec0;text-align:center;">
            Email généré automatiquement par ar.ia
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>"""
    return html, images


# ─── ENVOI SMTP ───────────────────────────────────────────────────────────────

def _envoyer_email_smtp(destinataires: list[str], objet: str, html_body: str,
                        images: dict | None = None) -> tuple[bool, str]:
    """Envoie l'email HTML via SMTP avec images CID. Retourne (succès, message)."""
    provider  = st.session_state.get("smtp_provider", "Gmail")
    custom    = provider == "Serveur personnalisé"
    preset    = _SMTP_PRESETS[provider]
    host      = st.session_state.get("smtp_host", "") if custom else preset["host"]
    port      = int(st.session_state.get("smtp_port", preset["port"]))
    login     = st.session_state.get("smtp_login", "")
    password  = st.session_state.get("smtp_password", "")
    display   = st.session_state.get("smtp_display_name", "") or login

    if not login or not password:
        return False, "Configurez d'abord le SMTP (adresse + mot de passe)."
    if not destinataires:
        return False, "Aucun destinataire renseigné."

    images = images or {}

    if images:
        # multipart/related uniquement quand il y a des images CID
        msg = MIMEMultipart("related")
        msg["Subject"] = objet
        msg["From"]    = f"{display} <{login}>"
        msg["To"]      = ", ".join(destinataires)
        msg_alt = MIMEMultipart("alternative")
        msg.attach(msg_alt)
        msg_alt.attach(MIMEText(html_body, "html", "utf-8"))
        for cid, img_bytes in images.items():
            img = MIMEImage(img_bytes, "png")
            img.add_header("Content-ID", f"<{cid}>")
            img.add_header("Content-Disposition", "inline")
            msg.attach(img)
    else:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = objet
        msg["From"]    = f"{display} <{login}>"
        msg["To"]      = ", ".join(destinataires)
        msg.attach(MIMEText(html_body, "html", "utf-8"))

    try:
        context = ssl.create_default_context()
        with smtplib.SMTP(host, port, timeout=15) as server:
            server.ehlo()
            server.starttls(context=context)
            server.ehlo()
            server.login(login, password)
            server.sendmail(login, destinataires, msg.as_string())
        return True, f"Email envoyé à {len(destinataires)} destinataire(s)."
    except smtplib.SMTPAuthenticationError:
        return False, "Authentification refusée — vérifiez le mot de passe d'application."
    except Exception as e:
        return False, str(e)


# ─── SMTP : paramètres par fournisseur ───────────────────────────────────────

_SMTP_PRESETS = {
    "Gmail":                {"host": "smtp.gmail.com",        "port": 587},
    "Outlook / Office 365": {"host": "smtp.office365.com",    "port": 587},
    "Yahoo Mail":           {"host": "smtp.mail.yahoo.com",   "port": 587},
    "Serveur personnalisé": {"host": "",                      "port": 587},
}


def _tester_connexion_smtp(host: str, port: int, login: str, password: str) -> tuple[bool, str]:
    """Tente une connexion STARTTLS et un login SMTP. Retourne (succès, message)."""
    if not host or not login or not password:
        return False, "Remplissez le serveur, l'adresse et le mot de passe."
    try:
        context = ssl.create_default_context()
        with smtplib.SMTP(host, port, timeout=8) as server:
            server.ehlo()
            server.starttls(context=context)
            server.ehlo()
            server.login(login, password)
        return True, f"Connexion réussie sur {host}:{port} avec {login}"
    except smtplib.SMTPAuthenticationError:
        return False, "Authentification refusée — vérifiez le login/mot de passe.\n\nPour Gmail : utilisez un **mot de passe d'application** (Compte Google → Sécurité → Mots de passe des applications)."
    except smtplib.SMTPConnectError as e:
        return False, f"Impossible de joindre {host}:{port} — {e}"
    except TimeoutError:
        return False, f"Délai dépassé — {host}:{port} ne répond pas."
    except Exception as e:
        return False, str(e)


# ─── SECTION SMTP ─────────────────────────────────────────────────────────────

def _section_smtp():
    cfg = charger_email_config()
    with st.expander("⚙️ Configuration SMTP", expanded=st.session_state.email_smtp_expanded):
        st.caption("Ces paramètres sont stockés localement et jamais transmis à un serveur tiers.")
        col1, col2 = st.columns(2)
        with col1:
            provider = st.selectbox(
                "Fournisseur",
                list(_SMTP_PRESETS.keys()),
                key="smtp_provider",
            )
            preset = _SMTP_PRESETS[provider]
            custom = provider == "Serveur personnalisé"
            smtp_host = st.text_input(
                "Serveur SMTP",
                value=preset["host"],
                key="smtp_host",
                disabled=not custom,
            )
            smtp_port = st.number_input(
                "Port",
                value=preset["port"],
                min_value=1, max_value=65535,
                key="smtp_port",
                disabled=not custom,
            )
        with col2:
            smtp_login = st.text_input(
                "Adresse email expéditeur",
                value=st.session_state.get("smtp_login") or cfg.get("smtp_login", ""),
                placeholder="moi@gmail.com",
                key="smtp_login",
            )
            smtp_password = st.text_input(
                "Mot de passe / clé d'application",
                value=st.session_state.get("smtp_password") or cfg.get("smtp_password", ""),
                type="password",
                placeholder="••••••••••••",
                key="smtp_password",
                help="Pour Gmail : utilisez un mot de passe d'application (Compte Google → Sécurité → Mots de passe des applications).",
            )
            st.text_input(
                "Nom affiché à l'expéditeur",
                value=st.session_state.get("smtp_display_name") or cfg.get("smtp_display_name", ""),
                placeholder="Jean Dupont – Reporting",
                key="smtp_display_name",
            )

        # Résoudre host réel (preset si non-custom)
        host_reel = smtp_host if custom else preset["host"]

        if st.button("🔌 Tester la connexion SMTP", key="test_smtp"):
            with st.spinner(f"Connexion à {host_reel}:{smtp_port}…"):
                ok, msg = _tester_connexion_smtp(host_reel, smtp_port, smtp_login, smtp_password)
            if ok:
                sauvegarder_email_config({
                    "smtp_provider":      provider,
                    "smtp_host":          smtp_host,
                    "smtp_port":          smtp_port,
                    "smtp_login":         smtp_login,
                    "smtp_password":      smtp_password,
                    "smtp_display_name":  st.session_state.get("smtp_display_name", ""),
                })
                st.success(f"✅ {msg} — configuration sauvegardée")
            else:
                st.error(f"❌ {msg}")


# ─── SECTION PLANIFICATION ────────────────────────────────────────────────────

def _section_planification(modele_id: str):
    planif = st.session_state.email_planif.get(modele_id, {})

    with st.expander("🗓 Planification de l'envoi", expanded=False):
        freq = st.selectbox(
            "Fréquence",
            _FREQUENCES,
            index=_FREQUENCES.index(planif.get("frequence", "Manuel uniquement")),
            key=f"planif_freq_{modele_id}",
        )
        planif["frequence"] = freq

        if freq == "Hebdomadaire":
            col1, col2 = st.columns(2)
            with col1:
                planif["jour_semaine"] = st.selectbox(
                    "Jour d'envoi",
                    _JOURS_SEMAINE,
                    index=_JOURS_SEMAINE.index(planif.get("jour_semaine", "Lundi")),
                    key=f"planif_jour_{modele_id}",
                )
            with col2:
                planif["heure"] = st.text_input("Heure (HH:MM)",
                                                value=planif.get("heure", "08:00"),
                                                key=f"planif_heure_{modele_id}")

        elif freq in ("Mensuelle", "Bi-mensuelle"):
            col1, col2 = st.columns(2)
            with col1:
                planif["jour_mois"] = st.selectbox(
                    "Jour du mois",
                    _JOURS_MOIS,
                    index=_JOURS_MOIS.index(planif.get("jour_mois", "1")),
                    key=f"planif_jourm_{modele_id}",
                )
            with col2:
                planif["heure"] = st.text_input("Heure (HH:MM)",
                                                value=planif.get("heure", "08:00"),
                                                key=f"planif_heurem_{modele_id}")
            if freq == "Bi-mensuelle":
                planif["jour_mois_2"] = st.selectbox(
                    "Deuxième jour du mois",
                    _JOURS_MOIS,
                    index=_JOURS_MOIS.index(planif.get("jour_mois_2", "15")),
                    key=f"planif_jourm2_{modele_id}",
                )

        if freq != "Manuel uniquement":
            prochains = _calculer_prochains_envois(planif)
            st.caption(f"📅 Prochain envoi prévu : **{prochains}**")
            st.caption("⚠️ _Maquette — la planification n'est pas encore active._")

        st.session_state.email_planif[modele_id] = planif
        _sauvegarder_modeles()


def _calculer_prochains_envois(planif: dict) -> str:
    """Affiche une date fictive pour la maquette."""
    freq = planif.get("frequence", "")
    heure = planif.get("heure", "08:00")
    if freq == "Hebdomadaire":
        jour = planif.get("jour_semaine", "Lundi")
        return f"{jour} prochain à {heure}"
    elif freq in ("Mensuelle", "Bi-mensuelle"):
        jour = planif.get("jour_mois", "1")
        return f"Le {jour} du mois à {heure}"
    return "—"


# ─── PAGE PRINCIPALE ──────────────────────────────────────────────────────────

def afficher_page_emails():
    _init_email_state()

    # Injection CSS dynamique pour les bordures des containers selon le thème
    _theme = st.session_state.get("theme", "dark")
    if _theme != "dark":
        _bc = "#e8a020" if _theme == "deytime" else "#3AA48A"
        components.html(f"""
        <script>
        (function() {{
            function injectStyle() {{
                var doc = window.parent.document;
                var existing = doc.getElementById('aria-container-border-style');
                if (existing) existing.remove();
                var s = doc.createElement('style');
                s.id = 'aria-container-border-style';
                s.textContent = '[data-testid="stVerticalBlockBorderWrapper"] {{ border: 2px solid {_bc} !important; border-radius: 12px !important; background: #ffffff !important; box-shadow: none !important; }}';
                doc.head.appendChild(s);
            }}
            injectStyle();
            new MutationObserver(injectStyle).observe(
                window.parent.document.body, {{childList: true, subtree: true}}
            );
        }})();
        </script>
        """, height=0)

    st.markdown("## 📧 Gestionnaire de mails")
    st.caption("Composez et planifiez vos emails de reporting avec des données en direct depuis vos sources.")
    st.divider()

    # ── Configuration SMTP (globale, en haut) ────────────────────────────────
    _section_smtp()
    st.divider()

    # ── Sélecteur / création de modèles ──────────────────────────────────────
    col_titre, col_new = st.columns([5, 2])
    with col_titre:
        st.markdown("### Modèles d'emails")
    with col_new:
        if st.button("➕ Nouveau modèle", use_container_width=True, key="new_modele_btn"):
            st.session_state["_show_new_modele"] = not st.session_state.get("_show_new_modele", False)
            st.rerun()

    if st.session_state.get("_show_new_modele"):
        with st.container(border=True):
            col_n, col_o, col_ok = st.columns([3, 3, 1])
            with col_n:
                new_nom = st.text_input("Nom du modèle", placeholder="Ex : Suivi hebdo équipe",
                                        key="new_modele_nom")
            with col_o:
                new_obj = st.text_input("Objet de l'email", placeholder="Ex : 📊 Point semaine {semaine}",
                                        key="new_modele_objet")
            with col_ok:
                st.markdown("<br>", unsafe_allow_html=True)
                if st.button("✅", key="create_modele_ok") and new_nom.strip():
                    new_id = uuid.uuid4().hex[:6]
                    st.session_state.email_modeles.insert(0, {
                        "id": new_id, "nom": new_nom.strip(), "objet": new_obj.strip()
                    })
                    st.session_state.email_blocs[new_id] = []
                    st.session_state.email_planif[new_id] = {"frequence": "Manuel uniquement"}
                    st.session_state.email_destinataires[new_id] = ""
                    st.session_state.email_modele_actif = new_id
                    st.session_state["_show_new_modele"] = False
                    _sauvegarder_modeles()
                    st.rerun()

    modeles = st.session_state.email_modeles
    if not modeles:
        st.markdown("""
        <div class="empty-state">
            <div class="empty-state-icon">📧</div>
            <div class="empty-state-title">Aucun modèle d'email</div>
            <div class="empty-state-sub">Créez votre premier modèle ci-dessus.</div>
        </div>
        """, unsafe_allow_html=True)
        return

    # ── Tabs par modèle ───────────────────────────────────────────────────────
    noms_tabs = [m["nom"] for m in modeles]
    actif_idx = next(
        (i for i, m in enumerate(modeles)
         if m["id"] == st.session_state.email_modele_actif),
        0
    )
    tabs = st.tabs(noms_tabs)

    for i, (tab, modele) in enumerate(zip(tabs, modeles)):
        with tab:
            mid = modele["id"]
            st.session_state.email_modele_actif = mid  # track l'onglet actif

            # ── En-tête du modèle ──
            col_obj, col_ren, col_del = st.columns([6, 1, 1])
            with col_obj:
                nouvel_objet = st.text_input(
                    "Objet de l'email",
                    value=modele.get("objet", ""),
                    key=f"objet_{mid}",
                    placeholder="Objet visible par les destinataires",
                )
                if nouvel_objet != modele.get("objet", ""):
                    modele["objet"] = nouvel_objet
                    _sauvegarder_modeles()
                else:
                    modele["objet"] = nouvel_objet
            with col_ren:
                st.markdown("<br>", unsafe_allow_html=True)
                if st.button("✏️", key=f"ren_{mid}", help="Renommer"):
                    st.session_state[f"renaming_{mid}"] = not st.session_state.get(f"renaming_{mid}", False)
                    st.rerun()
            with col_del:
                st.markdown("<br>", unsafe_allow_html=True)
                if st.button("🗑", key=f"del_{mid}", help="Supprimer ce modèle"):
                    st.session_state.email_modeles = [m for m in modeles if m["id"] != mid]
                    if mid in st.session_state.email_blocs:
                        del st.session_state.email_blocs[mid]
                    st.session_state.email_modele_actif = (
                        st.session_state.email_modeles[0]["id"]
                        if st.session_state.email_modeles else None
                    )
                    _sauvegarder_modeles()
                    st.rerun()

            if st.session_state.get(f"renaming_{mid}"):
                new_nom = st.text_input("Nouveau nom", value=modele["nom"], key=f"rename_{mid}")
                if st.button("✅ Valider", key=f"rename_ok_{mid}"):
                    modele["nom"] = new_nom.strip()
                    st.session_state[f"renaming_{mid}"] = False
                    _sauvegarder_modeles()
                    st.rerun()

            st.divider()

            # ── Destinataires & Planification côte à côte ──
            col_dest, col_planif = st.columns(2)
            with col_dest:
                with st.expander("👥 Destinataires", expanded=False):
                    dest_raw = st.text_area(
                        "Emails (un par ligne)",
                        value=st.session_state.email_destinataires.get(mid, ""),
                        height=100,
                        key=f"dest_{mid}",
                        placeholder="commercial1@example.com\ncommercial2@example.com",
                        label_visibility="collapsed",
                    )
                    if dest_raw != st.session_state.email_destinataires.get(mid, ""):
                        st.session_state.email_destinataires[mid] = dest_raw
                        _sauvegarder_modeles()
                    else:
                        st.session_state.email_destinataires[mid] = dest_raw
                    nb = len([e for e in dest_raw.splitlines() if e.strip()])
                    st.caption(f"{nb} destinataire(s) configuré(s)")
            with col_planif:
                _section_planification(mid)

            st.divider()

            # ── Éditeur + Aperçu côte à côte ──
            col_edit, col_preview = st.columns([1, 1], gap="large")

            with col_edit:
                with st.container(border=True, key=f"email_comp_{mid}"):
                    col_titre_edit, col_save = st.columns([3, 2])
                    with col_titre_edit:
                        st.markdown("#### ✏️ Composition")
                    with col_save:
                        st.markdown("<br>", unsafe_allow_html=True)
                        if st.button("💾 Sauvegarder", key=f"save_blocs_{mid}", use_container_width=True):
                            _sauvegarder_modeles()
                            st.toast("Modifications sauvegardées ✅")
                    _editeur_blocs(mid)

            with col_preview:
                with st.container(border=True, key=f"email_prev_{mid}"):
                    st.markdown("#### 👁 Aperçu")
                    blocs = st.session_state.email_blocs.get(mid, [])
                    _apercu_email(blocs, modele.get("objet", ""))

            st.divider()

            # ── Actions d'envoi ──
            col_send, col_test, col_info = st.columns([2, 2, 3])

            dest_liste = [e.strip() for e in
                          st.session_state.email_destinataires.get(mid, "").splitlines()
                          if e.strip()]

            with col_send:
                if st.button("📤 Envoyer maintenant", key=f"send_{mid}",
                             use_container_width=True, type="primary"):
                    erreurs: list = []
                    _sauvegarder_modeles()
                    with st.spinner("Génération et envoi en cours…"):
                        blocs_envoi = st.session_state.email_blocs.get(mid, [])
                        html, imgs = _construire_html_email(blocs_envoi, erreurs)
                        ok, msg_envoi = _envoyer_email_smtp(
                            dest_liste, modele.get("objet", ""), html, imgs
                        )
                    if erreurs:
                        for e in erreurs:
                            st.warning(f"⚠️ {e}")
                    if ok:
                        st.success(f"✅ {msg_envoi}")
                    else:
                        st.error(f"❌ {msg_envoi}")

            with col_test:
                login = st.session_state.get("smtp_login", "")
                if st.button("🧪 Envoyer un test", key=f"test_send_{mid}",
                             use_container_width=True,
                             help=f"Envoie à {login or 'votre adresse SMTP'}"):
                    if not login:
                        st.warning("Configurez d'abord le SMTP.")
                    else:
                        erreurs: list = []
                        _sauvegarder_modeles()
                        with st.spinner("Envoi du test…"):
                            blocs_envoi = st.session_state.email_blocs.get(mid, [])
                            html, imgs = _construire_html_email(blocs_envoi, erreurs)
                            ok, msg_envoi = _envoyer_email_smtp(
                                [login], f"[TEST] {modele.get('objet', '')}", html, imgs
                            )
                        if erreurs:
                            for e in erreurs:
                                st.warning(f"⚠️ {e}")
                        if ok:
                            st.success(f"✅ Test envoyé à {login}")
                        else:
                            st.error(f"❌ {msg_envoi}")

            with col_info:
                planif = st.session_state.email_planif.get(mid, {})
                freq = planif.get("frequence", "Manuel uniquement")
                if freq != "Manuel uniquement":
                    st.caption(f"🗓 Planifié : {freq} · {_calculer_prochains_envois(planif)}")
                else:
                    st.caption("🗓 Envoi manuel uniquement")
