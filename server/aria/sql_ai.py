"""
sql_ai.py — Phase 3 : génération SQL par IA + modification
"""

import os
import re
import json
from datetime import datetime

import openai

# ─── CLIENT OPENAI ────────────────────────────────────────────────────────────

client = openai.OpenAI()

# ─── CONSTANTES ───────────────────────────────────────────────────────────────

NOM_MOIS = {
    1: "janvier", 2: "février", 3: "mars", 4: "avril",
    5: "mai", 6: "juin", 7: "juillet", 8: "août",
    9: "septembre", 10: "octobre", 11: "novembre", 12: "décembre"
}

RULES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "rules")

def _lire_rules(nom_fichier: str) -> str:
    path = os.path.join(RULES_DIR, nom_fichier)
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    return ""

# Chargés dynamiquement dans _construire_system_prompt() pour refléter les modifs sans redémarrage

# ─── PATTERNS DE MODIFICATION ─────────────────────────────────────────────────

MODIFIER_PREFIXES_ADD = re.compile(
    r"^\s*(ajoute[z]?|ajout[e]?[z]?|rajoute[z]?|ajouter|rajouter)\b",
    re.IGNORECASE
)
MODIFIER_PREFIXES_REMOVE = re.compile(
    r"^\s*(enlève[z]?|enleve[z]?|enlever|supprime[z]?|supprimer|retire[z]?|retirer|cache|cacher|masque[z]?|masquer|vire[z]?|virer)\b",
    re.IGNORECASE
)
MODIFIER_PREFIXES_SORT = re.compile(
    r"^\s*(tri[e]?[z]?|trier|classe[z]?|classer|classement|ordonne[z]?|ordonner|sort[s]?|sorting|ordre)\b",
    re.IGNORECASE
)
MODIFIER_PREFIXES_CALC = re.compile(
    r"^\s*(fait[e]?[s]?\s+(moi\s+)?(un\s+)?total|fais\s+(moi\s+)?(un\s+)?total|calcule[z]?|totalise[z]?|additionne[z]?|multiplie[z]?|somme[z]?|en\s+plus|et\s+en\s+plus)\b",
    re.IGNORECASE
)
MODIFIER_PREFIXES_RENAME = re.compile(
    r"^\s*(renomme[z]?|renommer|rebaptise[z]?|rebaptiser|change[z]?\s+le\s+nom\s+de|appelle[z]?\s+la\s+colonne)\b",
    re.IGNORECASE
)
MODIFIER_PREFIXES_REORDER = re.compile(
    r"^\s*(mets?\s+les\s+colonnes|réorganise[z]?\s+les\s+colonnes|réordonne[z]?\s+les\s+colonnes|place[z]?\s+les\s+colonnes|dans\s+cet\s+ordre\s*:|mets?\s+.{1,40}\s+en\s+(première|deuxième|troisième|quatrième|cinquième|1ère?|2ème?|3ème?|4ème?|5ème?|\d+ème?)\s+(position|colonne)?|déplace[z]?\s+|met[s]?\s+.{1,40}\s+en\s+colonne\s+\d+)",
    re.IGNORECASE
)

# Patterns search() (n'importe où dans la phrase) pour les reformulations indirectes
_MOD_SORT_SEARCH = re.compile(
    r"\b(tri[e]?[z]?|trier|classe[z]?|classer|classement|ordonne[z]?|ordonner|sort[s]?|"
    r"dans\s+l.ordre|par\s+ordre|ordre\s+alpha|alphabétique|alphabetique|"
    r"du\s+plus\s+(grand|petit)|croissant|décroissant|decroissant)\b",
    re.IGNORECASE
)
_MOD_ADD_SEARCH = re.compile(
    r"\b(ajoute[z]?|ajouter|rajoute[z]?|rajouter)\b",
    re.IGNORECASE
)
_MOD_REMOVE_SEARCH = re.compile(
    r"\b(enlève[z]?|enlever|supprime[z]?|supprimer|retire[z]?|retirer|masque[z]?|masquer|vire[z]?|virer)\b",
    re.IGNORECASE
)
_MOD_RENAME_SEARCH = re.compile(
    r"\b(renomme[z]?|renommer|rebaptise[z]?|rebaptiser)\b",
    re.IGNORECASE
)

# ─── AJOUT COLONNE PYTHON (sans LLM) ─────────────────────────────────────────

_STOP_WORDS = {"le", "la", "les", "l", "un", "une", "des", "du", "aussi",
               "également", "colonne", "champ", "ligne", "donnée", "données",
               "moi", "nous", "me", "ce", "cet", "cette", "mon", "ma", "mes",
               "son", "sa", "ses", "leur", "leurs", "et", "ou", "de", "à",
               "avec", "sans", "pour", "par", "dans", "sur", "en", "au", "aux",
               "plus", "encore", "aussi", "bien", "très", "même", "trop"}

def _resoudre_colonne_mini(instruction: str, colonnes_disponibles: list[str]) -> str | None:
    """
    Utilise gpt-4o-mini pour résoudre le nom de colonne depuis une instruction en langage naturel.
    Retourne le nom exact de la colonne ou None.
    Très rapide (~0.3s) et peu coûteux.
    """
    try:
        liste = ", ".join(colonnes_disponibles)
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            max_tokens=30,
            temperature=0,
            messages=[
                {"role": "system", "content": (f"Colonnes disponibles : {liste}\n"
                    "Réponds UNIQUEMENT avec le nom exact de la colonne correspondant à la demande, "
                    "ou 'null' si aucune ne correspond. Pas d'explication.")},
                {"role": "user", "content": instruction},
            ],
        )
        result = resp.choices[0].message.content.strip().strip('"').strip("'")
        if result.lower() == "null" or result not in colonnes_disponibles:
            return None
        return result
    except Exception:
        return None


def _appliquer_ajout_colonne(col_name: str, table_id: str, sql: str, viz_config: dict) -> dict | None:
    """Insère col_name dans le SELECT du SQL et retourne le viz_config mis à jour."""
    select_match = re.search(r'SELECT\s+(.*?)\s+FROM\b', sql, re.IGNORECASE | re.DOTALL)
    if not select_match:
        return None
    if re.search(rf'\b{re.escape(col_name)}\b', select_match.group(1), re.IGNORECASE):
        return None  # déjà présente

    alias_match = re.search(rf'\b{re.escape(table_id)}\s+(\w+)\b', sql, re.IGNORECASE)
    prefix = (alias_match.group(1) + ".") if alias_match else ""
    new_col = f"{prefix}{col_name}"

    new_sql = re.sub(
        r'(SELECT\s+[\s\S]+?)\s+(FROM\s)',
        lambda m: m.group(1) + f", {new_col} " + m.group(2),
        sql, count=1, flags=re.IGNORECASE
    )
    if new_sql == sql:
        return None
    return {**viz_config, "sql": new_sql}


def _ajouter_colonne_python(instruction: str, sql: str, viz_config: dict, mcd: dict):
    """
    Ajoute une colonne au SELECT par correspondance Python pure (instantané).
    Retourne le viz_config mis à jour, ou None → fallback vers modifier_sql.
    Aucun appel LLM : si la colonne n'est pas résoluble en Python, on laisse modifier_sql gérer.
    """
    if re.search(r'^\s*WITH\s+\w', sql, re.IGNORECASE | re.MULTILINE):
        return None

    colonnes_mcd = {}
    for table in mcd.get("tables", []):
        for col in table.get("colonnes", []):
            colonnes_mcd[col["nom"].lower()] = {"nom": col["nom"], "table": table["id"]}
    if not colonnes_mcd:
        return None

    mots = [m for m in re.findall(r'\b\w+\b', instruction.lower())
            if m not in _STOP_WORDS and len(m) >= 3]

    col_trouvee = None

    for mot in mots:
        if mot in colonnes_mcd:
            col_trouvee = colonnes_mcd[mot]
            break

    if not col_trouvee:
        for mot in mots:
            for col_key, col_info in colonnes_mcd.items():
                if mot in col_key or col_key.startswith(mot):
                    col_trouvee = col_info
                    break
            if col_trouvee:
                break

    if not col_trouvee:
        return None  # pas de match Python → modifier_sql prend le relais, sans surcouche

    return _appliquer_ajout_colonne(col_trouvee["nom"], col_trouvee["table"], sql, viz_config)


# ─── HELPERS INTERNES ─────────────────────────────────────────────────────────

def _est_source_deytime(mcd: dict) -> bool:
    """Détecte si la source chargée est DeyTime en vérifiant la présence de tables caractéristiques."""
    table_names = {t["id"].lower() for t in mcd.get("tables", [])}
    return bool(table_names & {"employees", "day_leave", "work_days", "time_slots"})


def _get_rules_filename(source_label: str) -> str:
    """Retourne le nom du fichier de règles associé à une source."""
    safe = source_label.replace(" ", "_").replace(".xlsx", "").replace(".xls", "")
    return f"{safe}.md"


_COLONNES_SENSIBLES = re.compile(
    r"(nom|prenom|pr[eé]nom|name|firstname|lastname|surname|first_name|last_name"
    r"|email|mail|t[eé]l|phone|mobile|portable"
    r"|adresse|address|street|rue|ville|city|zip|postal|cp"
    r"|salaire|salary|wage|r[eé]mun|paie|pay"
    r"|siret|siren|nir|insee|s[eé]cu|passport"
    r"|mdp|password|token|secret)",
    re.IGNORECASE
)

def _est_colonne_sensible(nom: str) -> bool:
    """Retourne True si le nom de colonne suggère une donnée personnelle ou confidentielle."""
    return bool(_COLONNES_SENSIBLES.search(nom))


def _construire_tables_resume(mcd: dict) -> list[str]:
    """Construit le résumé des tables pour le prompt, en masquant les valeurs des colonnes sensibles."""
    tables_resume = []
    for t in mcd["tables"]:
        cols = []
        for c in t["colonnes"]:
            sensible = _est_colonne_sensible(c["nom"])
            ligne = f"  {c['nom']} {c['type_sql']}"
            ligne += " PK" if c.get("pk") else ""
            ligne += f" FK→{c['fk']['table']}.{c['fk']['colonne']}" if c.get("fk") else ""
            if not sensible:
                ligne += f" valeurs={c['valeurs']}" if c.get("valeurs") and len(c["valeurs"]) <= 20 else ""
                ligne += f" ex={c['exemples']}" if c.get("exemples") and not c.get("valeurs") else ""
            ligne += f"  -- {c['description']}" if c.get("description") else ""
            cols.append(ligne)
        tables_resume.append(f"TABLE {t['id']} ({t['nb_lignes']} lignes) :\n" + "\n".join(cols))
    return tables_resume


def _construire_system_prompt(mcd: dict) -> str:
    """Compose le system prompt : base + règles spécifiques à la source (fichiers rules/)."""
    prompt = _lire_rules("base.md")
    if _est_source_deytime(mcd):
        prompt += "\n" + _lire_rules("deytime.md")
    else:
        source_label = mcd.get("source_label", "")
        regles_source = _lire_rules(_get_rules_filename(source_label))
        if regles_source:
            prompt += "\n" + regles_source
    return prompt


def _construire_df_affiche(df, viz_config: dict):
    """Reconstruit le DataFrame tel qu'il est affiché (colonnes calculées par Python)."""
    import pandas as pd
    df = df.copy()
    if viz_config.get("show_total_col"):
        num_cols = [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c])]
        if num_cols and "Total" not in df.columns:
            df["Total"] = df[num_cols].sum(axis=1)
    return df


def _tri_python(instruction: str, df, viz_config: dict = None):
    """Tente de trier df selon l'instruction. Retourne (df_trié, col, ascending) ou None."""
    import pandas as pd
    # Construire le DataFrame avec les colonnes calculées (Total, etc.)
    if viz_config:
        df = _construire_df_affiche(df, viz_config)
    instr = instruction.lower()
    # Direction
    is_alpha = bool(re.search(r"alphab", instr, re.IGNORECASE))
    is_desc  = bool(re.search(
        r"\b(décroissant|decroissant|desc)\b|grand.{0,10}petit|élevé.{0,10}bas|haut.{0,10}bas",
        instr, re.IGNORECASE
    ))
    ascending = False if (is_desc and not is_alpha) else True

    # Mots significatifs de l'instruction
    _stop = {"par", "les", "des", "du", "la", "le", "au", "plus", "que", "sur",
             "dans", "une", "trier", "trie", "tri", "classe", "classer", "ordre",
             "grand", "petit", "haut", "bas", "croissant", "décroissant",
             "alphabétique", "alphabetique", "colonne", "tableau", "liste", "col"}
    instr_words = {w for w in re.findall(r"\w+", instr) if len(w) >= 3 and w not in _stop}

    all_cols  = list(df.columns)
    num_cols  = [c for c in all_cols if pd.api.types.is_numeric_dtype(df[c])]
    text_cols = [c for c in all_cols if not pd.api.types.is_numeric_dtype(df[c])]

    col_found = None
    # 1. Correspondance exacte sur toutes les colonnes
    for col in all_cols:
        if col.lower() in instr:
            col_found = col
            break
    # 2. Correspondance par mot
    if col_found is None:
        for col in all_cols:
            col_words = set(re.findall(r"\w+", col.lower()))
            if col_words & instr_words:
                col_found = col
                break
    # 3. Fallback : alphabétique → 1ère colonne texte ; numérique → dernière colonne numérique
    if col_found is None:
        if is_alpha and text_cols:
            col_found = text_cols[0]
        elif num_cols:
            col_found = num_cols[-1]
    if col_found is None:
        return None
    return df.sort_values(col_found, ascending=ascending, key=lambda x: x.str.lower() if x.dtype == object else x), col_found, ascending

# ─── POST-PROCESSEUR SQL ──────────────────────────────────────────────────────

def _corriger_cagnotte_sql(sql: str) -> str:
    """
    Post-processeur : corrige les sous-requêtes time_banks mal générées par l'IA.

    Erreurs typiques de l'IA (claude-haiku notamment) :
    - SUM(tb.quantity) filtré WHERE type='CREDIT' → ignore les DEBIT, résultat faux
    - Résultat en minutes sans /60.0
    - UPPER(tb.status) != 'REFUSED' absent
    """
    if not re.search(r'\btime_banks\b', sql, re.IGNORECASE):
        return sql

    already_correct = bool(re.search(
        r"CASE\s+WHEN\s+(?:tb\.)?type\s*=\s*'CREDIT'", sql, re.IGNORECASE
    ))

    if not already_correct:
        # Remplacer SUM(quantity) ou SUM(tb.quantity) par la formule CASE WHEN correcte
        sql = re.sub(
            r'SUM\s*\(\s*(?:tb\.)?quantity\s*\)',
            "SUM(CASE WHEN tb.type='CREDIT' THEN tb.quantity "
            "WHEN tb.type='DEBIT' THEN -tb.quantity ELSE 0 END)",
            sql, flags=re.IGNORECASE
        )
        # Supprimer le filtre AND type='CREDIT' ou AND type='DEBIT' (maintenant dans le CASE WHEN)
        sql = re.sub(
            r"\s+AND\s+(?:tb\.)?type\s*=\s*'(?:CREDIT|DEBIT)'",
            "", sql, flags=re.IGNORECASE
        )

    # Ajouter /60.0 si absent (juste après COALESCE(SUM(CASE ... END), 0) et avant FROM time_banks)
    if not re.search(r"END\s*\)\s*,\s*0\s*\)\s*/\s*60", sql, re.IGNORECASE):
        sql = re.sub(
            r"(END\s*\)\s*,\s*0\s*\))(\s+FROM\s+time_banks)",
            r"\1 / 60.0\2",
            sql, flags=re.IGNORECASE
        )

    # Ajouter UPPER(tb.status) != 'REFUSED' si absent
    if "REFUSED" not in sql.upper():
        sql = re.sub(
            r"(FROM\s+time_banks\s+\w+\s+WHERE\s)",
            r"\1UPPER(tb.status) != 'REFUSED' AND ",
            sql, flags=re.IGNORECASE
        )

    return sql


# ─── FONCTIONS PUBLIQUES ───────────────────────────────────────────────────────

def est_modification(question: str) -> bool:
    """Retourne True si la question est une demande de modification du résultat affiché."""
    # Correspondance en début de phrase (cas nominal)
    if (MODIFIER_PREFIXES_ADD.match(question)
            or MODIFIER_PREFIXES_REMOVE.match(question)
            or MODIFIER_PREFIXES_SORT.match(question)
            or MODIFIER_PREFIXES_CALC.match(question)
            or MODIFIER_PREFIXES_RENAME.match(question)
            or MODIFIER_PREFIXES_REORDER.match(question)):
        return True
    # Correspondance n'importe où dans la phrase (reformulations indirectes)
    if (_MOD_SORT_SEARCH.search(question)
            or _MOD_ADD_SEARCH.search(question)
            or _MOD_REMOVE_SEARCH.search(question)
            or _MOD_RENAME_SEARCH.search(question)):
        return True
    return False


def question_vers_sql(question: str, mcd: dict) -> dict:
    tables_resume = _construire_tables_resume(mcd)

    relations_txt = "\n".join([
        f"  {r['de']}.{r['colonne']} → {r['vers']}.{r['vers_colonne']}"
        for r in mcd.get("relations", [])
    ])

    annee_courante = datetime.now().year
    mois_courant = datetime.now().month

    prompt = f"""MCD SOURCE :
{'='*60}
{chr(10).join(tables_resume)}

RELATIONS (FK) :
{relations_txt}
{'='*60}

CONTEXTE TEMPOREL (utilise ces valeurs directement dans le SQL, jamais YEAR('now')) :
  - Année courante : {annee_courante}
  - Année précédente : {annee_courante - 1}
  - Mois courant : {mois_courant} ({NOM_MOIS[mois_courant]})

QUESTION : {question}"""

    response = client.chat.completions.create(
        model="gpt-4o",
        max_tokens=3000,
        temperature=0,
        messages=[
            {"role": "system", "content": _construire_system_prompt(mcd)},
            {"role": "user", "content": prompt},
        ],
    )
    raw = response.choices[0].message.content.strip()
    raw = raw.replace("```json", "").replace("```", "").strip()
    result = json.loads(raw)

    # ── Override : ranking → table si l'utilisateur demande explicitement une liste ──
    _LISTE_KEYWORDS = re.compile(
        r"\b(liste|listing|dans une liste|en liste|tableau|détail|détaillé)\b",
        re.IGNORECASE
    )
    if result.get("type_viz") == "ranking" and _LISTE_KEYWORDS.search(question):
        result["type_viz"] = "table"

    # ── Override : pivot → bar quand l'IA se trompe ──────────────────────────
    # Si type_viz=pivot mais que la question ne contient pas de mots de comparaison
    # explicites (vs, N-1, comparer, 2024 vs 2025…), on bascule en bar/line.
    if result.get("type_viz") == "pivot" and not result.get("type_viz_explicit"):
        _PIVOT_KEYWORDS = re.compile(
            r"\b(vs\.?|versus|n[- ]?1|n[- ]?2|compar|c[oô]te[- ]à[- ]c[oô]te"
            r"|ann[ée]e[- ]par[- ]ann[ée]e|2\d{3}\s*(?:vs|et|/)\s*2\d{3})\b",
            re.IGNORECASE
        )
        if not _PIVOT_KEYWORDS.search(question):
            result["type_viz"] = "bar"
            result["pivot_col"] = None

    # ── Post-processeur SQL : corriger les erreurs time_banks ─────────────────
    if "sql" in result:
        result["sql"] = _corriger_cagnotte_sql(result["sql"])

    return result


def corriger_sql(question: str, mcd: dict, sql_errone: str, erreur: str) -> dict:
    """Renvoie à GPT-4o le SQL raté + l'erreur SQLite pour obtenir une version corrigée."""
    tables_resume = _construire_tables_resume(mcd)

    relations_txt = "\n".join([
        f"  {r['de']}.{r['colonne']} → {r['vers']}.{r['vers_colonne']}"
        for r in mcd.get("relations", [])
    ])

    annee_courante = datetime.now().year
    mois_courant = datetime.now().month

    prompt = f"""MCD SOURCE :
{'='*60}
{chr(10).join(tables_resume)}

RELATIONS (FK) :
{relations_txt}
{'='*60}

CONTEXTE TEMPOREL (utilise ces valeurs directement dans le SQL, jamais YEAR('now')) :
  - Année courante : {annee_courante}
  - Année précédente : {annee_courante - 1}
  - Mois courant : {mois_courant} ({NOM_MOIS[mois_courant]})

QUESTION ORIGINALE : {question}

SQL GÉNÉRÉ (incorrect) :
{sql_errone}

ERREUR SQLITE OBTENUE :
{erreur}

Le SQL ci-dessus a provoqué une erreur. Corrige-le en tenant compte de l'erreur et du MCD.
Retourne UNIQUEMENT le JSON corrigé, sans texte autour."""

    response = client.chat.completions.create(
        model="gpt-4o",
        max_tokens=3000,
        temperature=0,
        messages=[
            {"role": "system", "content": _construire_system_prompt(mcd)},
            {"role": "user", "content": prompt},
        ],
    )
    raw = response.choices[0].message.content.strip()
    raw = raw.replace("```json", "").replace("```", "").strip()
    result = json.loads(raw)

    # ── Post-processeur SQL : corriger les erreurs time_banks ─────────────────
    if "sql" in result:
        result["sql"] = _corriger_cagnotte_sql(result["sql"])

    return result


def modifier_sql(instruction: str, sql_actuel: str, viz_config_actuel: dict, mcd: dict) -> dict:
    """Modifie le SQL existant selon une instruction d'ajout ou suppression de colonne."""
    tables_resume = _construire_tables_resume(mcd)

    relations_txt = "\n".join([
        f"  {r['de']}.{r['colonne']} → {r['vers']}.{r['vers_colonne']}"
        for r in mcd.get("relations", [])
    ])

    viz_actuel_txt = json.dumps({
        "type_viz":       viz_config_actuel.get("type_viz"),
        "titre":          viz_config_actuel.get("titre"),
        "unite":          viz_config_actuel.get("unite"),
        "x_col":          viz_config_actuel.get("x_col"),
        "y_col":          viz_config_actuel.get("y_col"),
        "show_total":     viz_config_actuel.get("show_total", False),
        "show_total_col": viz_config_actuel.get("show_total_col", False),
    }, ensure_ascii=False)

    annee_courante = datetime.now().year
    mois_courant = datetime.now().month

    prompt = f"""MCD SOURCE :
{'='*60}
{chr(10).join(tables_resume)}

RELATIONS (FK) :
{relations_txt}
{'='*60}

CONTEXTE TEMPOREL (utilise ces valeurs directement dans le SQL, jamais YEAR('now')) :
  - Année courante : {annee_courante}
  - Année précédente : {annee_courante - 1}
  - Mois courant : {mois_courant} ({NOM_MOIS[mois_courant]})

SQL ACTUEL (celui affiché à l'utilisateur) :
{sql_actuel}

CONFIGURATION VISUELLE ACTUELLE :
{viz_actuel_txt}

INSTRUCTION DE MODIFICATION : {instruction}

Applique l'instruction en modifiant UNIQUEMENT le SQL actuel :
- Si c'est un ajout (ajoute, rajoute…) : ajoute la ou les colonnes demandées dans le SELECT.
  RÈGLE ABSOLUE : utiliser des sous-requêtes corrélées scalaires dans le SELECT (jamais de nouveaux JOINs).
  INTERDIT : LEFT JOIN time_banks tb ON ... → cela multiplie les lignes et fausse toutes les valeurs existantes.
  CORRECT : (SELECT SUM(...) FROM time_banks tb WHERE tb.employee_id = e.id ...) AS col
  La période déjà présente dans le SQL actuel (ex: YEAR=2026, MONTH=1) doit être réutilisée
  dans la sous-requête sans que l'utilisateur ait besoin de la répéter.
- Si c'est une suppression (enlève, supprime, retire, cache…) : retire la ou les colonnes demandées du SELECT. Ne modifie pas les WHERE, GROUP BY, ORDER BY sauf si la colonne supprimée y est indispensable.
- Si c'est un tri (trie, classe, ordonne…) : modifie ou ajoute la clause ORDER BY selon la colonne et le sens demandés (ASC/DESC). Si le sens n'est pas précisé, utilise DESC. Ne modifie rien d'autre. RÈGLE ABSOLUE : conserver exactement le type_viz actuel — ne JAMAIS passer à "ranking" ou tout autre type lors d'un tri. Si la colonne de tri n'existe pas encore dans le SELECT (ex: colonne calculée absente du SQL), l'ajouter dans le SELECT avec un alias puis trier dessus.
- Si c'est un renommage (renomme, rebaptise, change le nom de, appelle la colonne…) :
    Ajoute ou modifie l'alias AS de la colonne concernée dans le SELECT.
    Exemple : "renomme nom_client en Nom Entité" → `f.nom_client AS "Nom Entité"`
    Si la colonne a déjà un alias, remplace-le. Ne modifie rien d'autre.
    Met à jour x_col ou y_col dans le JSON si la colonne renommée correspond à l'un d'eux.
- Si c'est un réordonnancement des colonnes (mets les colonnes dans cet ordre, réorganise, place…) :
    Réordonne les expressions du SELECT en respectant exactement l'ordre demandé.
    Si une colonne demandée n'existe pas dans le SELECT actuel, ignore-la silencieusement.
    Ne modifie pas les WHERE, GROUP BY, ORDER BY, ni les JOIN.
    Met à jour x_col selon la première colonne de l'ordre demandé si pertinent.
- Si c'est un déplacement d'une colonne individuelle (mets X en deuxième position, déplace X en colonne 2, met X en première…) :
    Identifie la colonne concernée dans le SELECT actuel et déplace-la à la position demandée (1 = première).
    Toutes les autres colonnes conservent leur ordre relatif.
    Ne modifie pas les WHERE, GROUP BY, ORDER BY, ni les JOIN.
- Si c'est un total général (fait moi un total, totalise, additionne tout…) :
    Ajoute une colonne calculée `total` qui est la somme de TOUTES les colonnes numériques de mesure du SELECT actuel.
    Exemple : si le SELECT contient jours_conge, jours_absence, jours_cagnotte, jours_fermeture
    → ajoute : (COALESCE(jours_conge,0) + COALESCE(jours_absence,0) + COALESCE(jours_cagnotte,0) + COALESCE(jours_fermeture,0)) AS total
    Ne modifie pas les autres colonnes ni la structure.
- Si c'est un calcul partiel (ajoute une colonne X + Y, ajoute X * Y, somme de X et Y…) :
    Identifie les colonnes nommées dans l'instruction et ajoute une colonne calculée avec l'opération demandée (+, -, *, /).
    Utilise COALESCE(col, 0) pour chaque opérande pour éviter les NULL.
    Nomme la colonne de façon lisible (ex: total_conge_cagnotte, produit_jours_tarif).
- Si c'est un ajout des totaux au pluriel (ajoute les totaux, mets les totaux, totaux, ajoute les deux totaux…) :
    Mettre show_total = true ET show_total_col = true dans le JSON retourné. Ne pas modifier le SQL.
- Si c'est une suppression des totaux au pluriel (supprime les totaux, enlève les totaux…) :
    Mettre show_total = false ET show_total_col = false dans le JSON retourné. Ne pas modifier le SQL.
- Si c'est une suppression de ligne total (supprime/enlève/retire la ligne total, plus de ligne total…) :
    Mettre show_total = false dans le JSON retourné. Ne pas modifier le SQL.
- Si c'est une suppression de colonne total (supprime/enlève/retire la colonne total, plus de colonne total…) :
    Mettre show_total_col = false dans le JSON retourné. Ne pas modifier le SQL.
- Conserve la structure générale (mêmes tables, mêmes filtres, même logique d'agrégation).
- Met à jour x_col, y_col et titre si nécessaire.
- Retourne UNIQUEMENT le JSON complet, sans texte autour."""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        max_tokens=1500,
        temperature=0,
        messages=[
            {"role": "system", "content": ("Tu modifies un SQL SQLite existant selon une instruction. "
                "Respecte les fonctions custom disponibles : YEAR(), MONTH(), DAY(), WEEK(), "
                "TIME_DIFF_HOURS(), DURATION_HOURS(), DATE_DIFF_DAYS(). "
                "Retourne UNIQUEMENT le JSON demandé, sans texte autour.")},
            {"role": "user", "content": prompt},
        ],
    )
    raw = response.choices[0].message.content.strip()
    raw = raw.replace("```json", "").replace("```", "").strip()
    result = json.loads(raw)

    # ── Post-processeur SQL : corriger les erreurs time_banks ─────────────────
    if "sql" in result:
        result["sql"] = _corriger_cagnotte_sql(result["sql"])

    return result
