"""
ui_aide.py — Page Aide
"""

import streamlit as st


def afficher_page_aide():
    st.markdown("## ❓ Aide — Comment poser vos questions")
    st.divider()
    st.markdown("""
### 📊 Analyses disponibles
- Données **par période** : *par mois*, *par an*, *par semaine*, *sur 2025*
- Données **par entité** : *par salarié*, *par chantier*, *par client*, *par article*
- **Combinaisons** : *heures travaillées par salarié par mois*
- **Énumérations** → une colonne par item : *absentéisme (congés, absences, cagnotte, fermetures)*
- **Fiche individuelle** : *donne-moi la fiche de [nom du client]*, *donne-moi la fiche de [prénom nom du salarié]*

---

### 🖥️ Type d'affichage
| Ce que vous dites | Résultat |
|---|---|
| *"dans une liste"* / *"en tableau"* | Tableau détaillé |
| *"en graphique"* / *"en barres"* | Graphique à barres |
| *"en camembert"* | Graphique circulaire |
| *"en courbe"* | Graphique en ligne |
| *"donne-moi le total de…"* | Chiffre unique (KPI) |
| *"N et N-1"*, *"comparer les années"*, *"évolution par an"* | Tableau croisé dynamique (pivot) |

---

### ✏️ Affiner le dernier résultat *(sans relancer une analyse)*
| Commande | Effet |
|---|---|
| `ajoute [une colonne]` | Ajoute une colonne au tableau actuel |
| `enlève [une colonne]` | Retire une colonne |
| `trie par [colonne]` | Réordonne le tableau (DESC par défaut) |
| `trie par [colonne] croissant` | Tri ASC |
| `renomme [colonne] en [nouveau nom]` | Renomme l'en-tête d'une colonne |
| `mets les colonnes dans cet ordre : col1, col2, col3` | Réorganise l'ordre des colonnes |
| `mets [colonne] en deuxième position` | Déplace une colonne à une position précise |
| `déplace [colonne] en colonne 2` | Idem |
| `fait moi un total` | Additionne toutes les mesures dans une colonne |
| `ajoute une colonne X + Y` | Colonne calculée (somme) |
| `ajoute une colonne X * Y` | Colonne calculée (multiplication) |

---

### 💡 Exemples
```
Quels salariés ont le plus d'heures ce mois ?
Donne-moi le chiffre d'affaires par client sur 2025
Absentéisme (congés, absences, cagnotte) par salarié par mois
Heures travaillées et heures supplémentaires par salarié par semaine
```
*Puis enchaîner :*
```
→ ajoute une colonne congés + cagnotte
→ trie par total
→ enlève la colonne heures supplémentaires
→ renomme nom_client en Nom Entité
→ mets les colonnes dans cet ordre : Nom Entité, prénom, email, téléphone, CA généré
```
""")
    if st.button("← Retour aux questions"):
        st.session_state.page = "app"
        st.rerun()
