"""
viz.py — Graphiques, fiches, commentaires
"""

import re
from datetime import datetime

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st

# ─── COULEURS ─────────────────────────────────────────────────────────────────

COLORS_DARK    = ["#3AA48A", "#4a9fd4", "#e09a3a", "#e05555", "#bc8cff", "#5ddbbe", "#79c0ff"]
COLORS_LIGHT   = ["#3AA48A", "#2a7ab0", "#c47a20", "#d94040", "#7c5cbf", "#2d8270", "#1a6090"]
COLORS_DEYTIME = ["#e8a020", "#f0b535", "#c47a20", "#d94040", "#7c5cbf", "#3d7fe0", "#2d8270"]


def _get_colors() -> list:
    """Retourne la palette de couleurs selon le thème actif."""
    theme = st.session_state.get("theme", "dark")
    if theme == "deytime":
        return COLORS_DEYTIME
    return COLORS_DARK if theme == "dark" else COLORS_LIGHT


def _tv() -> dict:
    """Retourne un dict de couleurs adaptées au thème actif (dark / light / deytime)."""
    theme = st.session_state.get("theme", "dark")
    if theme == "dark":
        return {
            "bg":         "#161c24",
            "border":     "#263040",
            "txt":        "#e8eef5",
            "muted":      "#7a8fa8",
            "legend_txt": "#c8ccd6",
            "grid":       "#1c2530",
            "axis":       "#263040",
            "h_fill":     "#1c2530",
            "c_fill":     "#161c24",
            "acc_fill":   "#1a3535",
            "tot_fill":   "#0e3030",
            "kpi":        "#5ddbbe",
        }
    elif theme == "deytime":
        return {
            "bg":         "#f4f5f7",
            "border":     "#d0d5de",
            "txt":        "#1a1d23",
            "muted":      "#5f6878",
            "legend_txt": "#8a5c0a",
            "grid":       "#e8ecf0",
            "axis":       "#d0d5de",
            "h_fill":     "#f0ece4",
            "c_fill":     "#f4f5f7",
            "acc_fill":   "rgba(232,160,32,0.10)",
            "tot_fill":   "rgba(232,160,32,0.18)",
            "kpi":        "#e8a020",
        }
    else:  # light
        return {
            "bg":         "#ffffff",
            "border":     "#d0e8e2",
            "txt":        "#1a3030",
            "muted":      "#4a7068",
            "legend_txt": "#4a7068",
            "grid":       "#e8f4f1",
            "axis":       "#d0e8e2",
            "h_fill":     "#e8f4f1",
            "c_fill":     "#ffffff",
            "acc_fill":   "#c8ede5",
            "tot_fill":   "#a8d8cc",
            "kpi":        "#3AA48A",
        }

# ─── CONSTANTES ───────────────────────────────────────────────────────────────

NOMS_MOIS_FR = {
    1:"Janvier", 2:"Février", 3:"Mars", 4:"Avril", 5:"Mai", 6:"Juin",
    7:"Juillet", 8:"Août", 9:"Septembre", 10:"Octobre", 11:"Novembre", 12:"Décembre"
}

ICONS_FICHE = {
    "address": "📍", "adresse": "📍", "street": "📍", "rue": "📍",
    "phone": "📞", "telephone": "📞", "mobile": "📞", "tel": "📞",
    "email": "✉️", "mail": "✉️",
    "city": "🏙️", "ville": "🏙️", "zip": "📮", "postal": "📮",
    "name": "👤", "first_name": "👤", "last_name": "👤",
    "label": "🏷️", "note": "📝", "website": "🌐", "site": "🏗️",
}

# ─── HELPERS INTERNES ─────────────────────────────────────────────────────────

_PCT_COL_RE   = re.compile(r"(pct|pourcent|percent|taux|ratio|part|\bpct\b|%)", re.IGNORECASE)
_JOUR_COL_RE  = re.compile(r"(jour|conge|congé|fermeture|absence|nb_|nombre|count|nbre)", re.IGNORECASE)
_TEMPS_COL_RE = re.compile(r"^(annee|année|mois|semaine|week|year|month|an)$", re.IGNORECASE)

def _fmt_fr(v, suffix: str = "") -> str:
    """Formate un nombre en notation française : 1 256 369,89 €"""
    if v is None or (isinstance(v, float) and pd.isna(v)):
        return ""
    try:
        f = float(v)
        s = f"{f:,.2f}"          # toujours 2 décimales
        ip, dp = s.split(".")
        return ip.replace(",", " ") + "," + dp + suffix
    except (TypeError, ValueError):
        return str(v)

def _col_suffix(col_name: str, default_suffix: str) -> str:
    """Retourne '%' pour les %, '' pour les jours/comptages/temporels, sinon le suffix par défaut."""
    if _PCT_COL_RE.search(col_name):
        return " %"
    if _JOUR_COL_RE.search(col_name):
        return ""
    if _TEMPS_COL_RE.search(col_name):
        return ""
    return default_suffix

def _fmt_col(v, col_name: str, default_suffix: str) -> str:
    """Formate une valeur en tenant compte du type de colonne (% ou unité)."""
    if _TEMPS_COL_RE.search(col_name):
        try:
            return str(int(float(v)))
        except (TypeError, ValueError):
            return str(v) if v is not None else ""
    return _fmt_fr(v, _col_suffix(col_name, default_suffix))


def get_layout_base():
    COLORS = _get_colors()
    t = _tv()
    return dict(
        paper_bgcolor=t["bg"],
        plot_bgcolor=t["bg"],
        font=dict(family="Plus Jakarta Sans", color=t["muted"]),
        legend=dict(font=dict(color=t["legend_txt"], family="Plus Jakarta Sans")),
        height=420,
        separators=", ",
        margin=dict(l=40, r=20, t=60, b=40),
        xaxis=dict(
            gridcolor=t["grid"],
            linecolor=t["axis"],
            tickfont=dict(color=t["muted"])
        ),
        yaxis=dict(
            gridcolor=t["grid"],
            linecolor=t["axis"],
            tickfont=dict(color=t["muted"])
        ),
        colorway=COLORS,
    )

# ─── FICHE HTML ───────────────────────────────────────────────────────────────

def generer_fiche_html(result: pd.DataFrame, viz_config: dict) -> str:
    """Génère le HTML des fiches de contact."""
    import html as _h
    t      = _tv()
    bg     = t["bg"]
    border = t["border"]
    txt    = t["txt"]
    muted  = t["muted"]
    accent = t["kpi"]
    x_col  = viz_config.get("x_col", result.columns[0] if len(result.columns) > 0 else "")

    # Colonnes toujours affichées même si vides (champs contact essentiels)
    ALWAYS_SHOW = {"phone", "tel", "mobile", "email", "mail", "location", "zip_code", "city", "ville", "adresse", "address"}

    def _is_empty(val):
        return str(val) in ("nan", "None", "", "NaT")

    def _render_champ(col, val, force=False):
        if not force and _is_empty(val):
            return ""
        icon      = next((v for k, v in ICONS_FICHE.items() if k in col.lower()), "·")
        col_label = _h.escape(col.replace("_", " ").capitalize())
        val_safe  = _h.escape(str(val)) if not _is_empty(val) else '<span style="color:' + muted + ';font-style:italic;">—</span>'
        val_color = txt if not _is_empty(val) else muted
        return (
            '<div style="display:flex;gap:10px;padding:6px 0;border-bottom:1px solid ' + border + ';">'
            + '<span style="font-size:1rem;width:24px;text-align:center;flex-shrink:0;">' + icon + '</span>'
            + '<div>'
            + '<div style="font-size:0.7rem;color:' + muted + ';text-transform:uppercase;letter-spacing:0.5px;">' + col_label + '</div>'
            + '<div style="font-size:0.92rem;color:' + val_color + ';font-weight:500;">' + val_safe + '</div>'
            + '</div></div>'
        )

    out = ['<div style="display:flex;flex-wrap:wrap;gap:1rem;">']
    for _, row in result.iterrows():
        titre = _h.escape(str(row[x_col]) if x_col in row.index else str(row.iloc[0]))
        champs = []
        for col, val in row.items():
            if col == x_col:
                continue
            force = any(k in col.lower() for k in ALWAYS_SHOW)
            rendered = _render_champ(col, val, force=force)
            if rendered:
                champs.append(rendered)
        out.append(
            '<div style="background:' + bg + ';border:1px solid ' + border
            + ';border-radius:14px;padding:1.2rem 1.4rem;margin-bottom:0.5rem;'
            + 'box-shadow:0 2px 12px rgba(58,164,138,0.08);min-width:280px;flex:1;max-width:500px;">'
            + '<div style="font-family:\'Plus Jakarta Sans\',sans-serif;font-weight:700;font-size:1.1rem;color:'
            + accent + ';margin-bottom:0.8rem;padding-bottom:0.6rem;border-bottom:2px solid ' + accent + '33;">'
            + titre + '</div>'
            + "".join(champs)
            + '</div>'
        )
    out.append("</div>")
    return "".join(out)

# ─── GRAPHIQUE V2 ─────────────────────────────────────────────────────────────

def generer_graphique_v2(result: pd.DataFrame, viz_config: dict) -> go.Figure:
    COLORS = _get_colors()
    type_viz = viz_config.get("type_viz", "bar")
    titre    = viz_config.get("titre", "Résultat")
    x_col    = viz_config.get("x_col")
    y_col    = viz_config.get("y_col")
    unite    = viz_config.get("unite")

    # Garde-fou : basculer en table uniquement si trop de colonnes identitaires (pas de temps, pas numériques)
    # Ne jamais forcer "table" quand le type a été demandé explicitement (flag "explicit" dans viz_config)
    TEMPS_COLS = {"annee", "année", "an", "year", "mois", "month", "semaine", "week", "trimestre", "quarter"}
    type_explicite = viz_config.get("type_viz_explicit", False)
    if type_viz in ("bar", "line", "pie", "ranking") and not type_explicite:
        non_num_cols = result.select_dtypes(exclude="number").columns.tolist()
        dim_cols = [c for c in non_num_cols if c.lower() not in TEMPS_COLS]
        if len(dim_cols) >= 3:
            type_viz = "table"
            viz_config = {**viz_config, "type_viz": "table"}
    t        = _tv()

    cols_num = result.select_dtypes(include="number").columns.tolist()
    cols_all = result.columns.tolist()

    if x_col not in cols_all: x_col = cols_all[0] if cols_all else None
    if y_col not in cols_all: y_col = cols_num[0] if cols_num else (cols_all[-1] if cols_all else None)
    if not x_col or x_col not in result.columns: x_col = result.columns[0]
    if not y_col or y_col not in result.columns:
        cols_num2 = result.select_dtypes(include="number").columns.tolist()
        y_col = cols_num2[0] if cols_num2 else result.columns[-1]

    suffix_map = {"heures": " h", "minutes": " min", "euros": " €", "nombre": "", None: ""}
    suffix = suffix_map.get(unite, "")
    num_fmt = ",.2f"
    title_color = t["txt"]
    layout = {
        **get_layout_base(),
        "title": dict(text=titre, font=dict(family="Plus Jakarta Sans", size=18, color=title_color, weight=700)),
    }

    # Fusionner first_name + last_name en colonne "Salarié" pour éviter les doublons sur l'axe X
    fn_col = next((c for c in cols_all if c.lower() == "first_name"), None)
    ln_col = next((c for c in cols_all if c.lower() == "last_name"), None)
    if fn_col and ln_col:
        result = result.copy()
        result["Salarié"] = result[fn_col].fillna("").astype(str) + " " + result[ln_col].fillna("").astype(str)
        result = result.drop(columns=[fn_col, ln_col])
        # Salarié en tête, puis reorder temps/dims/calculs
        autres = [c for c in result.columns if c != "Salarié"]
        result = result[["Salarié"] + autres]
        from db import _reordonner_colonnes
        result = _reordonner_colonnes(result)
        if x_col in (fn_col, ln_col):
            x_col = "Salarié"
        cols_all = result.columns.tolist()
        cols_num = result.select_dtypes(include="number").columns.tolist()

    has_year  = any(c.lower() in ("year", "annee", "année") or "year" in c.lower() for c in cols_all)
    has_month = any(c.lower() in ("month", "mois") or "month" in c.lower() for c in cols_all)
    year_col  = next((c for c in cols_all if c.lower() in ("year", "annee") or c.lower().startswith("year")), None)
    month_col = next((c for c in cols_all if c.lower() in ("month", "mois") or c.lower().startswith("month")), None)

    if has_month and month_col:
        result = result.copy()
        result = result.dropna(subset=[month_col])
        # Dictionnaire inverse : nom français (minuscule) → numéro
        NOM_VERS_NUM = {v.lower(): k for k, v in NOMS_MOIS_FR.items()}
        # Essayer d'abord la conversion numérique
        month_num = pd.to_numeric(result[month_col], errors="coerce")
        # Si tout est NaN → colonne contient des noms de mois texte
        if month_num.isna().all():
            month_num = result[month_col].astype(str).str.strip().str.lower().map(NOM_VERS_NUM)
        # Supprimer les lignes où le mois est toujours inconnu
        result = result[month_num.notna()].copy()
        month_num = month_num[month_num.notna()].astype(int)
        sort_cols = []
        if has_year and year_col:
            sort_cols.append(year_col)
        result["__sort__"] = month_num.apply(lambda m: f"{m:02d}")
        sort_cols.append("__sort__")
        result = result.sort_values(sort_cols).drop(columns=["__sort__"])
        # Assignation par index d'abord (Series → alignement correct malgré le tri),
        # puis conversion en Categorical depuis la colonne du DataFrame (positionnelle mais désormais juste).
        result["__mois_fr__"] = month_num.map(lambda m: NOMS_MOIS_FR.get(m, str(m)))
        result[month_col] = pd.Categorical(
            result["__mois_fr__"],
            categories=list(NOMS_MOIS_FR.values()), ordered=True
        )
        result = result.drop(columns=["__mois_fr__"])
        result = result.rename(columns={month_col: "Mois"})
        if has_year and year_col:
            result = result.rename(columns={year_col: "Année"})
            year_col = "Année"
        x_col = "Mois"
        cols_all = result.columns.tolist()
        if y_col not in cols_all:
            cols_num = result.select_dtypes(include="number").columns.tolist()
            y_col = cols_num[0] if cols_num else cols_all[-1]

    # Fiche → figure vide, rendu via generer_fiche_html
    if type_viz == "fiche":
        fig = go.Figure()
        fig.update_layout(paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)",
                          height=10, margin=dict(l=0, r=0, t=0, b=0))
        return fig

    elif type_viz == "bar":
        # Colonnes de mesure = toutes les colonnes numériques sauf l'axe X et les colonnes temps
        y_cols_multi = [c for c in cols_num if c != x_col and c.lower() not in TEMPS_COLS]

        # Quand mois + année sont présents : créer un axe combiné "Jan 2024" pour éviter
        # que plusieurs années se cumulent sur le même mois
        if has_year and has_month and year_col and year_col in result.columns:
            result = result.copy()
            result["__periode__"] = result[x_col].astype(str) + " " + result[year_col].astype(str)
            x_col = "__periode__"
            color_col = None  # l'année est déjà encodée dans l'axe X
        else:
            color_col = year_col if has_year and year_col and len(y_cols_multi) <= 1 else None

        # Tri décroissant par valeur principale (sauf si axe temporel)
        if not (has_year and has_month) and y_col in result.columns:
            result = result.sort_values(y_col, ascending=False)
        result[x_col] = result[x_col].astype(str)
        if color_col and color_col in result.columns:
            result[color_col] = result[color_col].astype(str)
        if len(y_cols_multi) > 1:
            # Plusieurs mesures → barres groupées
            fig = px.bar(result, x=x_col, y=y_cols_multi,
                         barmode="group", color_discrete_sequence=COLORS)
        else:
            fig = px.bar(result, x=x_col, y=y_col, color=color_col,
                         barmode="group" if color_col else "relative",
                         color_discrete_sequence=COLORS)
        fig.update_traces(
            marker_line_width=0,
            hovertemplate=f"%{{x}}<br><b>%{{y:{num_fmt}}}{suffix}</b><extra></extra>",
        )
        fig.update_xaxes(type="category", categoryorder="trace", title_text="")
        fig.update_yaxes(tickformat=num_fmt, ticksuffix=suffix, title_text="")

    elif type_viz == "line":
        if has_month:
            months_present = set(result[x_col].astype(str).tolist())
            ordered_months = [m for m in NOMS_MOIS_FR.values() if m in months_present]
            month_order_map = {m: i for i, m in enumerate(ordered_months)}
            result = result.copy()
            result["__month_order__"] = result[x_col].astype(str).map(month_order_map)
            _sort_cols = ([year_col] if has_year and year_col and year_col in result.columns else []) + ["__month_order__"]
            result = result.sort_values(_sort_cols).drop(columns=["__month_order__"])
        result[x_col] = result[x_col].astype(str)
        color_col = year_col if has_year and year_col else None
        if color_col and color_col in result.columns:
            result[color_col] = result[color_col].astype(str)
        fig = px.line(result, x=x_col, y=y_col, color=color_col,
                      markers=True, color_discrete_sequence=COLORS)
        fig.update_traces(
            line=dict(width=2.5), marker=dict(size=7),
            hovertemplate=f"%{{x}}<br><b>%{{y:{num_fmt}}}{suffix}</b><extra></extra>",
        )
        if has_month:
            fig.update_xaxes(type="category", categoryorder="array",
                             categoryarray=ordered_months, title_text="")
        else:
            fig.update_xaxes(type="category", title_text="")
        fig.update_yaxes(tickformat=num_fmt, ticksuffix=suffix, title_text="")

    elif type_viz == "pie":
        fig = px.pie(result, names=x_col, values=y_col,
                     color_discrete_sequence=COLORS, hole=0.4)
        lbl_color = t["txt"]
        fig.update_traces(
            textposition="outside",
            texttemplate="%{percent:.1%}<br>(%{value:,.2f}" + (suffix or "") + ")",
            hovertemplate=f"%{{label}}<br><b>%{{value:{num_fmt}}}{suffix}</b> (%{{percent:.1%}})<extra></extra>",
            outsidetextfont=dict(family="Plus Jakarta Sans", size=12, color=lbl_color),
            automargin=True,
        )
        layout["margin"] = dict(l=80, r=80, t=60, b=60)

    elif type_viz == "kpi":
        val = result[y_col].sum() if y_col and y_col in result.columns else len(result)
        kpi_color = t["kpi"]
        title_c   = t["muted"]
        fig = go.Figure(go.Indicator(
            mode="number",
            value=round(float(val), 2),
            title={"text": titre, "font": {"family": "Plus Jakarta Sans", "color": title_c, "size": 16}},
            number={"font": {"family": "Plus Jakarta Sans", "color": kpi_color, "size": 64},
                    "valueformat": ",.2f", "suffix": suffix}
        ))

    elif type_viz == "ranking":
        result = result.copy()
        result[x_col] = result[x_col].astype(str)
        result = result.sort_values(y_col, ascending=True)
        fig = px.bar(result, x=y_col, y=x_col, orientation="h",
                     color=x_col, color_discrete_sequence=COLORS)
        fig.update_traces(
            marker_line_width=0,
            hovertemplate=f"%{{y}}<br><b>%{{x:{num_fmt}}}{suffix}</b><extra></extra>",
        )
        fig.update_yaxes(type="category")
        fig.update_xaxes(tickformat=num_fmt, ticksuffix=suffix)

    elif type_viz == "pivot":
        result = result.copy()
        pivot_col = viz_config.get("pivot_col")
        if not pivot_col or pivot_col not in result.columns:
            pivot_col = next((c for c in result.columns if c.lower() in ("annee", "année", "year")), None)
        if pivot_col and pivot_col in result.columns:
            index_cols = [c for c in result.columns if c != pivot_col and not pd.api.types.is_numeric_dtype(result[c])]
            value_cols = [c for c in result.columns if c != pivot_col and pd.api.types.is_numeric_dtype(result[c])]
            if not index_cols: index_cols = [result.columns[0]]
            if not value_cols: value_cols = [result.columns[-1]]
            try:
                pivot = result.pivot_table(
                    index=index_cols,
                    columns=pivot_col,
                    values=value_cols[0] if len(value_cols) == 1 else value_cols,
                    aggfunc="sum", fill_value=0
                )
                if isinstance(pivot.columns, pd.MultiIndex):
                    pivot.columns = [f"{v} {c}" for v, c in pivot.columns]
                else:
                    pivot.columns = [str(c) for c in pivot.columns]
                pivot = pivot.reset_index()
                num_c = pivot.select_dtypes(include="number").columns
                pivot[num_c] = pivot[num_c].round(2)
            except Exception:
                pivot = result
                index_cols = list(result.select_dtypes(exclude="number").columns)
            h_fill = t["h_fill"]
            c_fill = t["c_fill"]
            h_font = t["txt"]
            c_font = t["muted"]
            border = t["border"]
            acc_fill = t["acc_fill"]
            show_total     = viz_config.get("show_total", False)
            show_total_col = viz_config.get("show_total_col", False)
            tot_fill       = t["tot_fill"]

            # Colonne "Total" (somme de toutes les colonnes numériques par ligne)
            if show_total_col:
                num_cols_piv = [c for c in pivot.columns if pd.api.types.is_numeric_dtype(pivot[c])]
                pivot = pivot.copy()
                pivot["Total"] = pivot[num_cols_piv].sum(axis=1)

            piv_is_num = [pd.api.types.is_numeric_dtype(pivot[c]) for c in pivot.columns]
            piv_align  = ["right" if n else "left" for n in piv_is_num]
            n_rows     = len(pivot)
            col_names  = list(pivot.columns)

            # Pas de ligne total si aucune colonne numérique
            if not any(piv_is_num):
                show_total = False

            # Couleurs en-têtes : index=h_fill, valeurs=acc_fill, colonne Total=tot_fill
            pivot_header_colors = []
            for i, c in enumerate(col_names):
                if i < len(index_cols):
                    pivot_header_colors.append(h_fill)
                elif c == "Total":
                    pivot_header_colors.append(tot_fill)
                else:
                    pivot_header_colors.append(acc_fill)

            # Ligne de total optionnelle
            if show_total:
                total_row = {}
                first_label = True
                for i, c in enumerate(col_names):
                    if not piv_is_num[i]:
                        total_row[c] = "Total" if first_label else ""
                        first_label = False
                    else:
                        cn = c.lower()
                        is_avg_col = any(k in cn for k in ("taux", "pct", "%", "moyen", "moyenne", "avg", "ratio", "part"))
                        col_vals = pivot[c].dropna()
                        total_row[c] = col_vals.mean() if is_avg_col else col_vals.sum()

            # fill_color : toujours 2D [col][row] pour pouvoir colorer ligne ET/OU colonne
            # — colonne "Total" → tot_fill sur toutes ses lignes
            # — dernière ligne (show_total) → tot_fill sur toutes les colonnes
            piv_fill = []
            for c in col_names:
                is_tot_col = (c == "Total")
                row_colors = [tot_fill if is_tot_col else c_fill for _ in range(n_rows)]
                if show_total:
                    row_colors.append(tot_fill)
                piv_fill.append(row_colors)

            piv_cell_v = []
            for i, c in enumerate(col_names):
                col_data = list(pivot[c])
                if show_total:
                    col_data = col_data + [total_row[c]]
                if piv_is_num[i]:
                    piv_cell_v.append([_fmt_col(v, c, suffix) for v in col_data])
                else:
                    piv_cell_v.append([str(v) for v in col_data])
            fig = go.Figure(go.Table(
                header=dict(values=list(pivot.columns), fill_color=pivot_header_colors,
                            font=dict(color=h_font, family="Plus Jakarta Sans", size=13, weight=700),
                            line_color=border, align=piv_align),
                cells=dict(values=piv_cell_v, fill_color=piv_fill,
                           font=dict(color=c_font, family="Plus Jakarta Sans", size=12),
                           line_color=border, align=piv_align)
            ))
        else:
            type_viz = "table"

    elif type_viz == "table":
        result = result.copy()
        col_order = [c for c in viz_config.get("column_order", []) if c in result.columns]
        if col_order:
            result = result[col_order + [c for c in result.columns if c not in col_order]]
        sort_by = viz_config.get("sort_by")
        if sort_by and sort_by in result.columns:
            result = result.sort_values(sort_by, ascending=viz_config.get("sort_asc", False))
        h_fill = t["h_fill"]
        c_fill = t["c_fill"]
        h_font = t["txt"]
        c_font = t["muted"]
        border = t["border"]
        show_total     = viz_config.get("show_total", False)
        show_total_col = viz_config.get("show_total_col", False)
        tot_fill       = t["tot_fill"]

        # Colonne "Total" : somme de toutes les colonnes numériques par ligne
        num_cols_tbl = [c for c in result.columns if pd.api.types.is_numeric_dtype(result[c])]
        if show_total_col and num_cols_tbl:
            result = result.copy()
            result["Total"] = result[num_cols_tbl].sum(axis=1)

        col_names   = list(result.columns)
        col_is_num  = [pd.api.types.is_numeric_dtype(result[c]) for c in col_names]
        col_align   = ["right" if n else "left" for n in col_is_num]
        n_rows      = len(result)

        # Pas de ligne total si aucune colonne numérique (listing de noms, etc.)
        if not any(col_is_num):
            show_total = False

        # En-têtes : colonne "Total" → tot_fill, autres → h_fill
        tbl_header_colors = [tot_fill if c == "Total" else h_fill for c in col_names]

        # Ligne de total
        if show_total:
            total_row = {}
            first_label = True
            for i, c in enumerate(col_names):
                if not col_is_num[i]:
                    total_row[c] = "Total" if first_label else ""
                    first_label = False
                else:
                    cn = c.lower()
                    is_avg_col = any(k in cn for k in ("taux", "pct", "%", "moyen", "moyenne", "avg", "ratio", "part"))
                    col_vals = result[c].dropna()
                    total_row[c] = col_vals.mean() if is_avg_col else col_vals.sum()

        # fill_color 2D [col][row] : colonne "Total" verte, ligne total verte
        tbl_fill = []
        for c in col_names:
            is_tot_col = (c == "Total")
            row_colors = [tot_fill if is_tot_col else c_fill for _ in range(n_rows)]
            if show_total:
                row_colors.append(tot_fill)
            tbl_fill.append(row_colors)

        cell_vals = []
        for i, c in enumerate(col_names):
            col_data = list(result[c])
            if show_total:
                col_data = col_data + [total_row[c]]
            if col_is_num[i]:
                cell_vals.append([_fmt_col(v, c, suffix) for v in col_data])
            else:
                cell_vals.append([str(v) for v in col_data])
        fig = go.Figure(go.Table(
            header=dict(values=col_names, fill_color=tbl_header_colors,
                        font=dict(color=h_font, family="Plus Jakarta Sans", size=13),
                        line_color=border, align=col_align),
            cells=dict(values=cell_vals, fill_color=tbl_fill,
                       font=dict(color=c_font, family="Plus Jakarta Sans", size=12),
                       line_color=border, align=col_align)
        ))

    else:
        result[x_col] = result[x_col].astype(str)
        fig = px.bar(result, x=x_col, y=y_col, color_discrete_sequence=COLORS)

    fig.update_layout(**layout)
    return fig

# ─── COMMENTAIRE V2 ───────────────────────────────────────────────────────────

def generer_commentaire_v2(result: pd.DataFrame, viz_config: dict) -> str:  # noqa: C901
    type_viz = viz_config.get("type_viz", "")
    unite    = viz_config.get("unite", "")

    if type_viz == "fiche":
        return f"📋 **{len(result)} fiche(s)** trouvée(s)"
    if type_viz == "pivot":
        pivot_col  = viz_config.get("pivot_col", "annee")
        nb_periodes = result[pivot_col].nunique() if pivot_col in result.columns else "?"
        return f"📊 **Tableau croisé** — {len(result)} lignes · {nb_periodes} périodes comparées"
    if type_viz == "kpi":
        _y = viz_config.get("y_col")
        _num_cols = result.select_dtypes(include="number").columns.tolist()
        _val_col = _y if _y and _y in result.columns else (_num_cols[0] if _num_cols else None)
        if not _val_col:
            return "📌 Indicateur clé"
        _unit = {"euros": " €", "heures": " h", "minutes": " min"}.get(unite, "")
        _val = float(result[_val_col].iloc[0]) if len(result) == 1 else float(result[_val_col].sum())
        obs_kpi = [f"📌 **{_fmt_fr(_val, _unit)}**"]

        # Colonne mois précédent
        _prev_col = next((c for c in result.columns
                          if c.lower() in ("valeur_mois_prec", "valeur_mois_precedent", "mois_prec", "mois_precedent")), None)
        if _prev_col:
            _prev = float(result[_prev_col].iloc[0]) if len(result) == 1 else float(result[_prev_col].sum())
            if _prev > 0:
                _pct = (_val - _prev) / _prev * 100
                _sign = "+" if _pct >= 0 else ""
                _icon = "📈" if _pct >= 0 else "📉"
                obs_kpi.append(f"{_icon} vs mois précédent : **{_sign}{_pct:.1f}%** ({_fmt_fr(_prev, _unit)})")

        # Colonne même mois N-1
        _n1_col = next((c for c in result.columns
                        if c.lower() in ("valeur_annee_prec", "valeur_n1", "annee_prec", "n1", "n_1",
                                         "valeur_annee_precedente", "meme_mois_n1")), None)
        if _n1_col:
            _n1 = float(result[_n1_col].iloc[0]) if len(result) == 1 else float(result[_n1_col].sum())
            if _n1 > 0:
                _pct = (_val - _n1) / _n1 * 100
                _sign = "+" if _pct >= 0 else ""
                _icon = "📈" if _pct >= 0 else "📉"
                obs_kpi.append(f"{_icon} vs même mois N-1 : **{_sign}{_pct:.1f}%** ({_fmt_fr(_n1, _unit)})")

        return "\n\n".join(obs_kpi)

    x_col    = viz_config.get("x_col")
    y_col    = viz_config.get("y_col")
    cols_num = result.select_dtypes(include="number").columns.tolist()
    cols_all = result.columns.tolist()
    if x_col not in cols_all: x_col = cols_all[0] if cols_all else None
    if y_col not in cols_all: y_col = cols_num[0] if cols_num else (cols_all[-1] if cols_all else None)
    if len(result) == 0 or not y_col or y_col not in result.columns:
        return "Aucune donnée à analyser."
    if not pd.api.types.is_numeric_dtype(result[y_col]):
        return f"📊 **{len(result)} entrées** analysées"

    unit_lbl = {"euros": " €", "heures": " h", "minutes": " min"}.get(unite, "")

    def fmt(v):
        v = float(v)
        if abs(v) >= 1_000_000:
            s = f"{v/1_000_000:.2f}".replace(".", ",")
            return s + f" M{unit_lbl}"
        if abs(v) >= 1_000:
            s = f"{v/1_000:.2f}".replace(".", ",")
            return s + f" k{unit_lbl}"
        return f"{v:.2f}".replace(".", ",") + unit_lbl

    # ── Détection colonnes temporelles ────────────────────────────────────────
    MOIS_NUM = {"janvier":1,"février":2,"mars":3,"avril":4,"mai":5,"juin":6,
                "juillet":7,"août":8,"septembre":9,"octobre":10,"novembre":11,"décembre":12}
    mois_col  = next((c for c in cols_all if c.lower() in ("mois","month")), None)
    annee_col = next((c for c in cols_all if c.lower() in ("annee","année","year")), None)

    obs = []

    # ── Série temporelle avec années ──────────────────────────────────────────
    if annee_col:
        years = sorted(result[annee_col].dropna().unique())
        totals_by_year = {yr: result[result[annee_col] == yr][y_col].sum() for yr in years}

        if len(years) >= 2:
            last, prev = years[-1], years[-2]
            v_last, v_prev = totals_by_year[last], totals_by_year[prev]
            pct = (v_last - v_prev) / v_prev * 100 if v_prev else 0
            if pct >= 10:
                obs.append(f"📈 **Forte progression de {pct:.0f}%** entre {prev} et {last} "
                            f"({fmt(v_prev)} → {fmt(v_last)}) — dynamique très positive.")
            elif pct > 2:
                obs.append(f"📈 **Croissance de {pct:.0f}%** entre {prev} et {last} "
                            f"({fmt(v_prev)} → {fmt(v_last)}).")
            elif pct < -10:
                obs.append(f"⚠️ **Baisse importante de {abs(pct):.0f}%** entre {prev} et {last} "
                            f"({fmt(v_prev)} → {fmt(v_last)}) — point de vigilance.")
            elif pct < -2:
                obs.append(f"⚠️ **Recul de {abs(pct):.0f}%** entre {prev} et {last} "
                            f"({fmt(v_prev)} → {fmt(v_last)}).")
            else:
                obs.append(f"➡️ **Stabilité** entre {prev} et {last} (variation de {pct:+.1f}%).")

            if len(years) >= 3:
                v_first = totals_by_year[years[0]]
                n = len(years) - 1
                cagr = ((v_last / v_first) ** (1 / n) - 1) * 100 if v_first > 0 else 0
                if abs(cagr) >= 3:
                    word = "croissance" if cagr > 0 else "décroissance"
                    obs.append(f"📊 Taux de **{word} annuel moyen : {abs(cagr):.0f}%** "
                                f"sur {len(years)} ans ({years[0]}–{years[-1]}).")
        else:
            obs.append(f"📊 Total {years[0]} : **{fmt(totals_by_year[years[0]])}**.")

    # ── Tendance mensuelle (si mois présents) ─────────────────────────────────
    if mois_col:
        ref_year = None
        if annee_col:
            ref_year = sorted(result[annee_col].dropna().unique())[-1]
            df_m = result[result[annee_col] == ref_year].copy()
        else:
            df_m = result.copy()
        df_m["__m__"] = df_m[mois_col].astype(str).str.strip().str.lower().map(MOIS_NUM)
        df_m = df_m.dropna(subset=["__m__"]).sort_values("__m__")

        if len(df_m) >= 3:
            n2 = len(df_m) // 2
            avg_1 = df_m[y_col].iloc[:n2].mean()
            avg_2 = df_m[y_col].iloc[n2:].mean()
            best  = df_m.loc[df_m[y_col].idxmax()]
            worst = df_m.loc[df_m[y_col].idxmin()]
            yr_lbl = f" en {ref_year}" if ref_year else ""
            ratio  = best[y_col] / worst[y_col] if worst[y_col] > 0 else 1

            if avg_2 > avg_1 * 1.1:
                obs.append(f"📈 **Tendance haussière{yr_lbl}** — la seconde partie de période dépasse "
                            f"la première (+{(avg_2/avg_1-1)*100:.0f}%). "
                            f"Pic en **{best[mois_col]}** ({fmt(best[y_col])}).")
            elif avg_2 < avg_1 * 0.9:
                obs.append(f"⚠️ **Tendance baissière{yr_lbl}** — la seconde partie de période est en "
                            f"retrait de {(1-avg_2/avg_1)*100:.0f}% vs la première. "
                            f"Meilleur mois : **{best[mois_col]}** ({fmt(best[y_col])}).")
            else:
                obs.append(f"➡️ **Activité régulière{yr_lbl}**. "
                            f"Pic en **{best[mois_col]}** ({fmt(best[y_col])}), "
                            f"creux en **{worst[mois_col]}** ({fmt(worst[y_col])}).")

            if ratio >= 2 and not annee_col:
                obs.append(f"⚠️ **Forte saisonnalité** — l'écart entre le meilleur et le pire mois "
                            f"est de ×{ratio:.1f}. Anticipez les creux d'activité.")

    # ── Analyse catégorielle (pas de dimension temps) ─────────────────────────
    if not annee_col and not mois_col:
        total   = result[y_col].sum()
        mean_v  = result[y_col].mean()
        idx_max = result[y_col].idxmax()
        max_v   = result.loc[idx_max, y_col]
        max_l   = result.loc[idx_max, x_col] if x_col and x_col in result.columns else "?"
        pct_max = (max_v / total * 100) if total > 0 else 0
        idx_min = result[y_col].idxmin()
        min_v   = result.loc[idx_min, y_col]
        min_l   = result.loc[idx_min, x_col] if x_col and x_col in result.columns else "?"
        below   = (result[y_col] < mean_v).sum()

        if pct_max > 50:
            obs.append(f"⚠️ **{max_l}** concentre **{pct_max:.0f}%** du total ({fmt(max_v)}) "
                       f"— dépendance forte, risque à surveiller.")
        elif pct_max > 30:
            obs.append(f"🏆 **{max_l}** domine nettement avec **{pct_max:.0f}%** du total "
                       f"({fmt(max_v)} sur {fmt(total)}).")
        else:
            obs.append(f"🏆 Leader : **{max_l}** ({fmt(max_v)}, {pct_max:.0f}% du total). "
                       f"Performance globale : {fmt(total)}.")

        if len(result) > 2:
            if below > len(result) * 0.65:
                obs.append(f"📊 **{below}/{len(result)}** entrées sont sous la moyenne ({fmt(mean_v)}) "
                            f"— la performance globale est portée par peu d'éléments.")
            elif below < len(result) * 0.35:
                obs.append(f"✅ **Bonne homogénéité** — la majorité dépasse la moyenne de {fmt(mean_v)}.")

        if min_v < max_v * 0.1 and len(result) > 2:
            obs.append(f"⚠️ **{min_l}** est très en retrait ({fmt(min_v)}) "
                       f"— écart ×{max_v/min_v:.0f} avec le leader.")

    return "\n\n".join(obs[:3]) if obs else f"📊 {len(result)} entrées analysées"
