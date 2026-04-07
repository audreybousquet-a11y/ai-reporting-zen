═══ RÈGLES SPÉCIFIQUES SOURCE DEYTIME ═══

RÈGLE FONDAMENTALE — REQUÊTES MULTI-MÉTRIQUES PAR EMPLOYÉ :
  Dès qu'une requête combine PLUSIEURS de ces métriques : heures travaillées, congés,
  fermetures, absences, cagnotte → OBLIGATION d'utiliser UNIQUEMENT des sous-requêtes
  corrélées depuis employees. Jamais de JOINs multiples sur la même requête.
  Un JOIN sur days multiplié par un JOIN sur time_banks = explosion de lignes → tout est faux.

  STRUCTURE OBLIGATOIRE pour toute requête multi-métriques par employé :
  SELECT
    e.first_name,
    e.last_name,
    -- Heures travaillées (exemple janvier 2026)
    (SELECT COALESCE(SUM(wd2.time_worked), 0) / 60.0
     FROM days d2 JOIN work_days wd2 ON wd2.day_id = d2.id
     WHERE d2.employee_id = e.id AND d2.type = 'WORK_DAY'
       AND YEAR(d2.date) = 2026 AND MONTH(d2.date) = 1) AS heures_travaillees,
    -- Congés personnels
    (SELECT COALESCE(COUNT(*), 0) FROM days d3
     WHERE d3.employee_id = e.id AND d3.type = 'LEAVE'
       AND YEAR(d3.date) = 2026 AND MONTH(d3.date) = 1) AS jours_conge,
    -- Fermetures entreprise
    (SELECT COALESCE(COUNT(*), 0) FROM days d4
     WHERE d4.employee_id = e.id AND d4.type = 'EXCEPTIONAL_LEAVE'
       AND YEAR(d4.date) = 2026 AND MONTH(d4.date) = 1) AS jours_fermeture,
    -- Cagnotte (SUM des minutes, jamais COUNT)
    (SELECT COALESCE(SUM(CASE WHEN tb.type='CREDIT' THEN tb.quantity
                              WHEN tb.type='DEBIT' THEN -tb.quantity ELSE 0 END), 0) / 60.0
     FROM time_banks tb
     WHERE tb.employee_id = e.id AND UPPER(tb.status) != 'REFUSED'
       AND YEAR(tb.date) = 2026 AND MONTH(tb.date) = 1) AS heures_cagnotte
  FROM employees e
  ORDER BY e.last_name, e.first_name

  Chaque alias de sous-requête (d2, d3, d4…) doit être DIFFÉRENT pour éviter les conflits.
  Cette structure est à utiliser même quand on MODIFIE une requête existante :
  si la requête en cours a des JOINs sur days + work_days et qu'on ajoute time_banks
  → RÉÉCRIRE entièrement la requête avec cette structure, ne pas ajouter un JOIN.

CHEMINS DE JOINTURE OBLIGATOIRES :
  - Les colonnes start_time et end_time de time_slots contiennent UNIQUEMENT des heures (HH:MM:SS)
    Pour la date d'un time_slot : joins time_slots → work_days → days et utilise d.date
  - Ne jamais utiliser YEAR() ou MONTH() sur start_time ou end_time
  - Les colonnes time_worked, scheduled_time, time_bank de work_days sont des ENTIERS représentant des MINUTES (ex: 420 = 7h)
    Pour obtenir les heures : wd.time_worked / 60.0, wd.scheduled_time / 60.0
    Heures supplémentaires = SUM(wd.time_bank) / 60.0  (time_bank = time_worked - scheduled_time, peut être négatif)
    Ne jamais utiliser DURATION_HOURS() sur ces colonnes
  - CHEMIN OBLIGATOIRE employees ↔ time_slots (ne jamais dévier) :
      employees e
      JOIN days d ON d.employee_id = e.id
      JOIN work_days wd ON wd.day_id = d.id
      JOIN time_slots ts ON ts.work_day_id = wd.id
    work_days N'A PAS de colonne employee_id. days N'A PAS de colonne work_day_id.
    Ne jamais écrire : JOIN work_days wd ON wd.employee_id = e.id (INTERDIT)

ABSENTÉISME (OBLIGATOIRES) :
  Les jours réels sont stockés dans des tables de liaison — ne JAMAIS utiliser DATE_DIFF_DAYS sur les dates de ces tables.

  CONGÉS ET FERMETURES — SOURCE UNIQUE : table "days"
    La table days centralise tous les types de jours par employé :
      type = 'LEAVE'             → congé personnel posé par le salarié
      type = 'EXCEPTIONAL_LEAVE' → fermeture entreprise (jours fériés, vacances collectives)
      type = 'ABSENCE'           → absence (accident, maladie…)
      type = 'WORK_DAY'          → jour travaillé
      type = 'WEEK_END'          → week-end

    RÈGLE ABSOLUE : toujours utiliser la table days avec son champ type — ne jamais passer
    par leaves/day_leave ou employee_exceptional_leave/day_exceptional_leave pour compter les jours.
    Utiliser des SOUS-REQUÊTES CORRÉLÉES (jamais des JOINs sur une requête déjà groupée).

    → Congés personnels SUR UNE PÉRIODE :
      (SELECT COALESCE(COUNT(*), 0) FROM days d_lv
       WHERE d_lv.employee_id = e.id AND d_lv.type = 'LEAVE'
         AND YEAR(d_lv.date) = 2026 AND MONTH(d_lv.date) = 1) AS jours_conge

    → Fermetures entreprise SUR UNE PÉRIODE :
      (SELECT COALESCE(COUNT(*), 0) FROM days d_el
       WHERE d_el.employee_id = e.id AND d_el.type = 'EXCEPTIONAL_LEAVE'
         AND YEAR(d_el.date) = 2026 AND MONTH(d_el.date) = 1) AS jours_fermeture

    → Absences SUR UNE PÉRIODE :
      (SELECT COALESCE(COUNT(*), 0) FROM days d_ab
       WHERE d_ab.employee_id = e.id AND d_ab.type = 'ABSENCE'
         AND YEAR(d_ab.date) = 2026 AND MONTH(d_ab.date) = 1) AS jours_absence

    → Quand l'utilisateur demande "congés" sans précision → deux colonnes : jours_conge + jours_fermeture
    → Quand l'utilisateur demande "total congés" → jours_conge + jours_fermeture AS total_conges

  ABSENCES (absences) :
    Les jours = nombre de lignes dans absence_day (1 ligne = 1 jour d'absence)
    RÈGLE ABSOLUE : utiliser une SOUS-REQUÊTE CORRÉLÉE (jamais un JOIN).
    → Absences SUR UNE PÉRIODE :
      (SELECT COALESCE(COUNT(DISTINCT ad.id), 0)
       FROM absences ab
       JOIN absence_day ad ON ad.absence_id = ab.id
       JOIN days d_ab ON d_ab.id = ad.day_id
       WHERE ab.employee_id = e.id
         AND ab.deleted_at IS NULL
         AND YEAR(d_ab.date) = 2026 AND MONTH(d_ab.date) = 1) AS jours_absence

  FERMETURES EXCEPTIONNELLES (exceptional_leaves) :
    Passe par employee_exceptional_leave puis day_exceptional_leave
    → LEFT JOIN employee_exceptional_leave eel ON eel.employee_id = e.id
      LEFT JOIN day_exceptional_leave del ON del.exceptional_leave_id = eel.exceptional_leave_id
    → COALESCE(COUNT(DISTINCT del.id), 0) AS jours_fermeture

  CAGNOTTE (time_banks) :
    time_banks.quantity est en MINUTES. type = 'CREDIT' = alimentation, 'DEBIT' = utilisation.
    time_banks.date (DATE) = date du mouvement.

    RÈGLES ABSOLUES — toutes obligatoires en même temps :
    1. Sous-requête corrélée uniquement (jamais LEFT JOIN time_banks)
    2. TOUJOURS diviser par 60.0 — sans /60.0 le résultat est en minutes, pas en heures
    3. TOUJOURS CASE WHEN type='CREDIT' THEN quantity WHEN type='DEBIT' THEN -quantity
       — filtrer WHERE type='CREDIT' seul est INTERDIT car cela ignore les utilisations
    4. Exclure les refusés : AND UPPER(tb.status) != 'REFUSED'

    SQL INTERDIT — ne JAMAIS écrire ceci :
      SUM(tb.quantity) WHERE tb.type = 'CREDIT'   ← ignore les DEBIT, résultat faux
      COUNT(...)                                   ← compte des lignes, pas des heures

    SQL CORRECT — copier exactement ce modèle :
      (SELECT COALESCE(SUM(CASE WHEN tb.type='CREDIT' THEN tb.quantity
                               WHEN tb.type='DEBIT'  THEN -tb.quantity ELSE 0 END), 0) / 60.0
       FROM time_banks tb
       WHERE tb.employee_id = e.id
         AND UPPER(tb.status) != 'REFUSED'
         AND YEAR(tb.date) = 2026 AND MONTH(tb.date) = 1) AS heures_cagnotte

    → Résultat attendu : heures décimales, peut être négatif (ex: -6.50 = déficit de 6h30)

  GROUPEMENT TEMPOREL AVEC ABSENTÉISME :
    Quand on groupe par mois/année en plus de l'employé, utiliser les dates des tables de liaison via days :
    → Pour les absences : joindre days via absence_day : JOIN days d_ab ON d_ab.id = ad.day_id, GROUP BY YEAR(d_ab.date), MONTH(d_ab.date)
    → Pour les congés : joindre days via day_leave : JOIN days d_lv ON d_lv.id = dl.day_id, GROUP BY YEAR(d_lv.date), MONTH(d_lv.date)
    → Attention : si on groupe par mois sur plusieurs types, utiliser un CTE ou sous-requête par type puis joindre

  RÈGLE CRITIQUE — JOINTURES MULTI-SOURCES TEMPORELLES :
    Pour les requêtes combinant plusieurs sources avec des données temporelles (congés, absences,
    cagnotte, fermetures...), ne jamais piloter les jointures depuis une seule source.
    OBLIGATOIRE : construire un CTE "toutes_periodes" avec UNION de toutes les combinaisons
    (employee_id, annee, mois) de toutes les sources, puis joindre chaque CTE dessus :
      WITH toutes_periodes AS (
        SELECT employee_id, annee, mois FROM cte_conges
        UNION SELECT employee_id, annee, mois FROM cte_absences
        UNION SELECT employee_id, annee, mois FROM cte_cagnotte
        UNION SELECT employee_id, annee, mois FROM cte_fermetures
      )
      SELECT e.first_name, e.last_name,
             tp.annee, tp.mois,
             COALESCE(cg.jours_conge, 0) AS jours_conge,
             ...
      FROM toutes_periodes tp
      JOIN employees e ON e.id = tp.employee_id
      LEFT JOIN cte_conges cg ON cg.employee_id = tp.employee_id AND cg.annee = tp.annee AND cg.mois = tp.mois
      LEFT JOIN cte_absences ab ON ab.employee_id = tp.employee_id AND ab.annee = tp.annee AND ab.mois = tp.mois
      ...

CLIENTS ET ADRESSES :
  RÈGLES CRITIQUES sur les données customers :
  - Les noms (c.name) peuvent avoir des espaces en début/fin : toujours utiliser TRIM(c.name) dans le SELECT et les filtres
  - Certains noms sont vides ou espaces uniquement : toujours filtrer WHERE TRIM(c.name) != ''
  - work_sites.status : 'ACTIVE' = chantier en cours, 'ARCHIVED' = chantier terminé/archivé
  - customers.status : 'ACTIVE' = client actif, 'INACTIVE' = client inactif
  - Pour "clients ayant un chantier actif" → JOIN work_sites ws ON ws.customer_id = c.id AND UPPER(ws.status) = 'ACTIVE'
  - Pour "clients ayant un chantier" (sans précision) → tous statuts work_sites confondus
  - Les clients sont dans la table "customers", jamais dans "companies"
  - La table "companies" contient uniquement les données de l'entreprise utilisatrice de l'outil, pas les clients
  - Les adresses sont dans la table "addresses" (polymorphique) :
    La valeur exacte de addressable_type utilise UN SEUL antislash (pas deux) :
      Pour l'adresse d'un CLIENT   : LEFT JOIN addresses a ON a.addressable_id = c.id  AND a.addressable_type = 'App\Models\Customer'
      Pour l'adresse d'un CHANTIER : LEFT JOIN addresses a ON a.addressable_id = ws.id AND a.addressable_type = 'App\Models\WorkSite'
    Colonnes utiles : a.location (rue), a.zip_code (CP), a.city (ville), a.additional_information
    Toujours LEFT JOIN (l'adresse peut être absente)
  - Quand la question porte sur des clients ET leurs chantiers, joindre l'adresse sur work_sites (pas sur customers)
  - Pour la fiche d'un client, inclure TOUJOURS : TRIM(c.name), c.phone, c.email, a.location, a.zip_code, a.city — même si certains peuvent être NULL
  - Pour filtrer par statut/status, utilise toujours UPPER() : WHERE UPPER(c.status) = 'ACTIVE'
  - Pour rechercher un client par nom dans un listing : WHERE UPPER(TRIM(c.name)) LIKE UPPER('%valeur%')
  - Pour une fiche d'un client précis (type_viz = "fiche") : rechercher chaque mot du nom séparément avec LIKE :
    Ex : "fiche de Alain Briaud" → WHERE UPPER(TRIM(c.name)) LIKE '%ALAIN%' AND UPPER(TRIM(c.name)) LIKE '%BRIAUD%'
    Ne jamais utiliser = UPPER('nom complet') car le nom peut être stocké dans un ordre différent (NOM Prénom ou Prénom NOM)
  - Pour rechercher un employé par nom dans un listing : WHERE UPPER(e.first_name) LIKE UPPER('%valeur%') OR UPPER(e.last_name) LIKE UPPER('%valeur%')
  - Pour la fiche d'un employé précis (type_viz = "fiche") : rechercher chaque mot séparément avec LIKE :
    Ex : "fiche de Kevin Lespalier" → WHERE UPPER(e.first_name) LIKE '%KEVIN%' AND UPPER(e.last_name) LIKE '%LESPALIER%'
    Ou si un seul mot donné : WHERE UPPER(e.first_name) LIKE '%MOT%' OR UPPER(e.last_name) LIKE '%MOT%'
    Ne jamais utiliser = UPPER('valeur') — l'ordre prénom/nom peut varier
  - Pour type_viz = "fiche", le SQL doit TOUJOURS inclure le nom/label de l'entité en premier dans le SELECT

MEILLEURS CLIENTS (chiffre d'affaires) :
  Dans Deytime il n'y a pas de colonne CA directe. Le chiffre d'affaires par client =
  heures travaillées sur ses chantiers × prix de vente horaire de l'employé.
  - "meilleurs clients", "top clients", "clients les plus importants", "clients par CA" :
    → mesure = ROUND(SUM(TIME_DIFF_HOURS(ts.start_time, ts.end_time) * e.selling_price / 100.0), 2) AS ca
    → chemin EXACT à utiliser (ne pas dévier) :
        FROM customers c
        JOIN work_sites ws ON ws.customer_id = c.id
        JOIN time_slots ts ON ts.work_site_id = ws.id
        JOIN work_days wd ON ts.work_day_id = wd.id
        JOIN days d ON wd.day_id = d.id
        JOIN employees e ON d.employee_id = e.id
    → filtres obligatoires : ts.type = 'ACTIVITY' AND e.selling_price > 0
    → GROUP BY c.name ORDER BY ca DESC LIMIT N
    → Ne JAMAIS passer par work_days.work_site_id (cette colonne n'est pas fiable)
    → Ne jamais utiliser COUNT ou des heures brutes seules pour "meilleurs clients"
  - "clients avec le plus d'heures" : utiliser SUM(TIME_DIFF_HOURS(...)) AS heures (pas le CA)

COÛTS ET MARGES :
  - hourly_cost et selling_price dans employees sont stockés en CENTIMES : divise par 100.0 pour avoir les euros
  - Coût de revient horaire = e.hourly_cost / 100.0
  - Prix de vente horaire = e.selling_price / 100.0
  - Coût de revient total = SUM(TIME_DIFF_HOURS(ts.start_time, ts.end_time)) * (e.hourly_cost / 100.0)
    avec chemin obligatoire employees → days → work_days → time_slots et filtre ts.type = 'ACTIVITY' (exclure LUNCH)
  - Marge brute par heure = (e.selling_price - e.hourly_cost) / 100.0
  - Pierre Mingot (EXECUTIVE) a hourly_cost = 0 : l'exclure des calculs de coût sauf si demandé explicitement
