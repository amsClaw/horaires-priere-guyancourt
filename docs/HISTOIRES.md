# HISTOIRES — Horaires de prière Guyancourt

Découpage en 7 histoires, 1 à 4h chacune, à river dans l'ordre. Plafonds respectés par histoire (≤500 lignes/fichier, ≤1500 lignes total projet, ≤20 fichiers) — chaque histoire ci-dessous reste largement sous ces plafonds individuellement.

## Histoire 1 — Squelette du dépôt et harnais de test
**Titre :** Initialiser le projet avec un `npm test` qui collecte au moins un test réel.
**Critères d'acceptation :**
- `package.json` avec script `test` utilisant Node natif (`node --test`) ou une lib de test ultra-légère si besoin (justifier le choix en 1 ligne dans le README).
- Un fichier `src/solar.js` vide/squelette (une fonction exportée, ex. `julianDay(date)`, qui a une implémentation réelle même minimale).
- Un fichier `test/solar.test.js` avec au moins 1 test qui appelle `julianDay` et vérifie une valeur connue (ex. jour julien du 1er janvier 2000 = 2451545).
- `npm test` s'exécute en CLI et rapporte "1 test passed" (ou équivalent), zéro échec.
**Ne touche pas :** UI, calcul Fajr/Isha, dépôt GitHub distant (le push est fait mais aucune logique de prière encore).
**Résultat visible :** sortie terminal de `npm test` montrant un test vert.

## Histoire 2 — Position solaire de base (déclinaison, équation du temps, midi solaire)
**Titre :** Calculer la déclinaison solaire, l'équation du temps et le midi solaire vrai pour une date/coordonnées données.
**Critères d'acceptation :**
- `src/solar.js` expose `solarDeclination(date)`, `equationOfTime(date)`, `solarNoon(date, lon)`.
- Tests unitaires pour le 21 mars (équinoxe) : déclinaison ≈ 0° (±0.5°), et pour le 21 juin/21 décembre, déclinaison proche de ±23.44° (±0.3°).
- Test : `solarNoon` pour Guyancourt le 21 mars tombe entre 12h00 et 13h00 heure locale (CET).
- `npm test` toujours vert, ≥4 tests collectés.
**Ne touche pas :** angles Fajr/Isha, règle de repli été, UI.
**Résultat visible :** nouveaux tests verts dans la sortie `npm test`.

## Histoire 3 — Calcul Fajr, Chorouq, Dhouhr, Asr, Maghreb par angle (méthode UOIF, cas hiver/équinoxe)
**Titre :** Implémenter les 5 horaires calculables par angle solaire (hors Isha-repli), méthode UOIF 12°.
**Critères d'acceptation :**
- `src/prayerTimes.js` expose `computePrayerTimes(date, lat, lon)` retournant `{fajr, sunrise, dhuhr, asr, maghrib, isha}` en objets Date UTC.
- Dhouhr = midi solaire vrai + 3 min (test à la seconde).
- Fajr = angle 12° avant lever ; Maghreb = coucher réel (-0.833°) ; Isha = angle 12° après coucher (pas encore de repli — retourne `null` si indéfini, traité en histoire 4).
- Test avec date 21 décembre (nuit longue, angles toujours définis) : Fajr/Isha comparés ±2 min à une référence externe figée en commentaire (source citée, ex. mawaqit.net).
- Test d'ordre : Fajr < sunrise < dhuhr < asr < maghrib le 21 décembre.
**Ne touche pas :** repli été, fuseau horaire DST (traité histoire 5), UI.
**Résultat visible :** tests verts avec valeurs comparées à une source externe citée en commentaire.

## Histoire 4 — Repli « 1/7 de la nuit » pour les nuits sans crépuscule astronomique
**Titre :** Détecter l'indéfini (angle jamais atteint) et appliquer la règle 1/7 de la nuit pour Fajr/Isha.
**Critères d'acceptation :**
- `computePrayerTimes` détecte quand le calcul par angle est `NaN`/indéfini et bascule automatiquement sur : nuit = coucher(J) → lever(J+1) ; Isha = coucher + nuit/7 ; Fajr = lever − nuit/7.
- Test unitaire au 21 juin pour Guyancourt : Fajr et Isha non-null, et respectent Fajr < sunrise < dhuhr < asr < maghrib < isha.
- Test de régression : le 21 décembre (histoire 3) reste inchangé après ce changement (pas de repli déclenché à tort).
- Commentaire dans le code expliquant explicitement pourquoi le repli existe (le piège du domaine, angle 18°→12° etc.).
**Ne touche pas :** UI, fuseau horaire.
**Résultat visible :** test du 21 juin vert, avec log/commentaire montrant quelle branche (angle vs repli) a été utilisée.

## Histoire 5 — Fuseau horaire Europe/Paris et passage heure d'été/hiver
**Titre :** Convertir les horaires UTC calculés en heure locale Europe/Paris correcte toute l'année.
**Critères d'acceptation :**
- Fonction `toParisLocalTime(dateUTC)` utilisant `Intl.DateTimeFormat` ou équivalent natif (pas de lib externe — justifier si une dépendance est quand même nécessaire).
- Test : un horaire calculé en janvier affiche une heure cohérente avec UTC+1 ; un horaire de juillet avec UTC+2 (comparé à des valeurs figées en dur, source citée).
- Format de sortie HH:MM (2 chiffres, 24h).
**Ne touche pas :** UI, calcul angle/repli (déjà fait).
**Résultat visible :** tests verts montrant la conversion DST correcte pour les deux dates.

## Histoire 6 — Page HTML unique affichant les 6 horaires du jour
**Titre :** Construire l'UI statique (`index.html` + `src/app.js`) qui appelle le module de calcul et affiche les horaires.
**Critères d'acceptation :**
- `index.html` : une page simple, coordonnées Guyancourt en dur, appelle `computePrayerTimes(new Date(), LAT, LON)` au chargement.
- Affiche : date du jour (fr-FR) + les 6 horaires nommés (Fajr, Chorouq, Dhouhr, Asr, Maghreb, Isha) en HH:MM.
- CSS mobile-first minimal (pas de framework), lisible sans scroll horizontal sur 375px de large.
- Aucune requête réseau nécessaire au calcul (vérifiable dans l'onglet Network — pas de fetch/XHR déclenché par le calcul).
- `src/app.js` importe `src/prayerTimes.js` en ES module natif (pas de bundler).
**Ne touche pas :** logique de calcul (déjà figée aux histoires 2-5), tests unitaires existants (ne doit rien casser dans `npm test`).
**Résultat visible :** capture d'écran de la page ouverte dans un navigateur montrant les 6 horaires du jour.

## Histoire 7 — Vérification visuelle mobile + README + jeu de contrôle manuel
**Titre :** Documenter le projet et produire la preuve visuelle mobile exigée par la spec.
**Critères d'acceptation :**
- `README.md` : comment lancer (`npm test`, ouvrir `index.html`), méthode de calcul retenue et pourquoi (renvoi à SPEC.md), dépendances utilisées et justification (idéalement zéro dépendance).
- Capture d'écran (fichier PNG dans `docs/` ou joint à la carte) de la page sur viewport 375×667 montrant les 6 horaires sans scroll horizontal ni superposition — critère observable de la SPEC §6.
- Tableau dans le README listant, pour les 2 scénarios holdout de la SPEC, les valeurs affichées par l'app et la valeur de référence externe comparée (avec source), pour preuve de conformité.
**Ne touche pas :** code de calcul, UI (sauf corrections de bug mineures découvertes pendant la vérification — dans ce cas, documenter le fix séparément).
**Résultat visible :** capture d'écran mobile + tableau de vérification holdout dans le README.
