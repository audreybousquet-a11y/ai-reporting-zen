# Règles spécifiques SOURCE (fichier de ventes)

## Structure de la table

La source ne contient qu'une seule table : `feuil1` avec les colonnes suivantes :
- `ANNEE` (INTEGER) : année de la vente
- `MOIS` (VARCHAR) : mois en lettres MAJUSCULES français (ex : 'JANVIER', 'AOÛT', 'DÉCEMBRE')
- `CLIENT` (VARCHAR) : nom du client
- `COMMERCIAL` (VARCHAR) : nom du commercial responsable
- `MONTANT` (FLOAT) : chiffre d'affaires de la ligne de vente

## Règles métier

### MONTANT = Chiffre d'affaires
- La colonne `MONTANT` représente le chiffre d'affaires (CA).
- "meilleurs clients", "top clients", "clients les plus importants" → `SUM(MONTANT)` GROUP BY CLIENT ORDER BY SUM(MONTANT) DESC
- "meilleurs commerciaux", "top commerciaux" → `SUM(MONTANT)` GROUP BY COMMERCIAL ORDER BY SUM(MONTANT) DESC
- "CA", "chiffre d'affaires", "ventes", "revenus" → toujours `SUM(MONTANT)` ou `COALESCE(SUM(MONTANT), 0)`
- Ne jamais utiliser COUNT ou des heures pour cette source — la seule mesure pertinente est MONTANT.

### Colonne MOIS
- Les valeurs sont en majuscules : 'JANVIER', 'FÉVRIER', 'MARS', 'AVRIL', 'MAI', 'JUIN',
  'JUILLET', 'AOÛT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE', 'DÉCEMBRE'
- Toujours filtrer avec `UPPER(f.MOIS) = 'NOM_EN_MAJUSCULES'`
  Exemple : `WHERE UPPER(f.MOIS) = 'JANVIER'`
- Ne jamais utiliser MONTH() sur cette colonne (c'est un VARCHAR, pas une DATE).
- Pour trier chronologiquement les mois, utiliser un CASE WHEN :
  ```sql
  ORDER BY CASE UPPER(f.MOIS)
    WHEN 'JANVIER' THEN 1 WHEN 'FÉVRIER' THEN 2 WHEN 'MARS' THEN 3
    WHEN 'AVRIL' THEN 4 WHEN 'MAI' THEN 5 WHEN 'JUIN' THEN 6
    WHEN 'JUILLET' THEN 7 WHEN 'AOÛT' THEN 8 WHEN 'SEPTEMBRE' THEN 9
    WHEN 'OCTOBRE' THEN 10 WHEN 'NOVEMBRE' THEN 11 WHEN 'DÉCEMBRE' THEN 12
  END
  ```

### Colonne ANNEE
- C'est un INTEGER, comparer directement : `WHERE f.ANNEE = 2025`
- Ne jamais entourer de YEAR() : c'est déjà une année.
