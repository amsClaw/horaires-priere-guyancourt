# SPEC — Horaires de prière Guyancourt

## Résultat attendu (une phrase)
Une page web unique, sans compte ni configuration, qui affiche les 5 horaires de prière du jour (Fajr, Chorouq, Dhouhr, Asr, Maghreb, Isha) pour Guyancourt (78280), calculés côté client, corrects toute l'année y compris en été.

## Exigences

1. **Localisation fixe.** L'app affiche les horaires pour Guyancourt (lat 48.7717° N, lon 2.0761° E, altitude ~160 m), pas de saisie de ville.
   Critère observable : le code source contient ces coordonnées en constante ; aucun champ de saisie de localisation n'existe dans le DOM.

2. **Méthode de calcul fixée : UOIF (angles 12°/12°).**
   Fajr = soleil à 12° sous l'horizon avant le lever ; Isha = soleil à 12° sous l'horizon après le coucher. Dhouhr = passage au méridien + décalage fixe (voir §4). Asr = méthode standard (Shafi, ombre = hauteur de l'objet). Maghreb = coucher du soleil réel (élévation -0.833°, réfraction standard).
   Critère observable : un test unitaire calcule les horaires du 21 mars (équinoxe, angles bien définis) et vérifie Fajr/Isha à ±2 min d'une référence externe documentée (ex. mawaqit.net ou export IslamicFinder pour Guyancourt, valeur figée en dur dans le test avec sa source en commentaire).

3. **Repli obligatoire pour nuits sans crépuscule astronomique (mi-mai à mi-août).**
   Quand le soleil ne descend jamais à 12° sous l'horizon, Fajr et Isha sont calculés par la règle **« 1/7 de la nuit »** : nuit = durée entre coucher et lever du soleil ; Isha = coucher + 1/7 de la nuit ; Fajr = lever − 1/7 de la nuit.
   Critère observable : un test unitaire calcule les horaires du 21 juin pour Guyancourt et vérifie que Fajr et Isha sont non-null, non-vides, et respectent Fajr < Chorouq < Dhouhr < Asr < Maghreb < Isha.

4. **Dhouhr = décalage fixe après le passage au méridien.**
   Dhouhr = midi solaire vrai + 3 minutes (marge de sécurité standard, évite le passage exact du soleil au zénith).
   Critère observable : test unitaire vérifie Dhouhr(midi solaire vrai) + 3 min, à la seconde près.

5. **Méthode non paramétrable par l'utilisateur (figée pour le pilote).**
   Aucun sélecteur de méthode de calcul n'existe dans l'UI. La méthode UOIF 12°/12° + repli 1/7 est câblée en dur.
   Critère observable : recherche dans le DOM/JS livré : aucun élément `<select>`/bouton lié à "méthode" ou "angle".

6. **Affichage simple, une page, lisible sur mobile.**
   La page affiche : date du jour (locale fr-FR), les 6 horaires nommés, rien d'autre d'obligatoire (pas de pub, pas de compte).
   Critère observable : capture d'écran sur viewport 375×667 (iPhone SE) montrant les 6 horaires sans scroll horizontal ni superposition.

7. **Horaires en heure locale Europe/Paris, format HH:MM 24h.**
   Le passage heure d'été/hiver est géré automatiquement.
   Critère observable : test unitaire compare un horaire calculé en janvier (CET, UTC+1) et un en juillet (CEST, UTC+2) contre des références figées ; les deux passent.

8. **Logique de calcul isolée, testable sans navigateur (Node.js pur).**
   Le module de calcul astronomique (angle solaire, équation du temps, déclinaison) est un fichier JS sans dépendance DOM, importable et testable via `npm test` (ex. Node `assert` ou une lib de test légère).
   Critère observable : `npm test` s'exécute en CLI (sans navigateur/headless) et rapporte au moins 5 tests collectés et passants ; zéro test collecté = échec.

9. **Page fonctionne sans backend ni base de données.**
   Tout le calcul se fait dans le navigateur au chargement, à partir de la date système. Pas d'appel réseau nécessaire pour le calcul (une API météo/horaires externe est explicitement hors périmètre).
   Critère observable : la page s'ouvre en fichier local (`file://`) ou serveur statique et affiche des horaires cohérents, sans requête réseau bloquante visible dans l'onglet Network (hors chargement des assets statiques).

## Décision d'Ams du 2026-09-23 — s'aligner sur la mosquée

Le contrôle terrain a montré que le calcul UOIF 12° donne cinq prières à ±2 min de la
Mosquée de Guyancourt, mais l'**Isha 23 minutes trop tôt**. Le calendrier publié par la
mosquée n'est pas une formule (Fajr figé à 05:00 en été, Isha = Maghreb + 90 min de mars à
septembre, 19:30 fixe en hiver). **Ams a tranché : l'app affiche les horaires publiés par
la mosquée** (`data/mosquee-guyancourt-2026.json`), et ne calcule que pour les dates que
le calendrier ne couvre pas. L'exigence 2 (UOIF 12°) devient le **repli**, pas la règle.

## Hors périmètre
- Choix de ville/localisation par l'utilisateur.
- Choix de méthode de calcul par l'utilisateur (UOIF/LIM/GMP) — figé pour ce pilote.
- Notifications, alarmes, rappels sonores.
- Calendrier hijri, dates islamiques, direction de la Qibla.
- Compte utilisateur, historique, préférences persistées.
- Application mobile native, PWA installable (peut être une amélioration future, pas ce pilote).
- Support d'autres villes ou d'une saisie de coordonnées.
- Internationalisation (l'app est en français uniquement).

## Hypothèses non prouvées
- ~~H1~~ **TRANCHÉ par Ams le 2026-09-23 : méthode UOIF 12°/12°.** Ce n'est plus une hypothèse.
- ~~H2~~ **TRANCHÉ par Ams le 2026-09-23 : repli « 1/7 de la nuit ».** Ce n'est plus une hypothèse.
- H3 : aucune contrainte de conformité/marque religieuse (ex. validation par une mosquée locale de Guyancourt) n'est attendue pour ce pilote.
- H4 : l'utilisateur cible consulte l'app sur mobile en priorité (d'où l'exigence de capture 375×667), mais ce n'est pas confirmé.
- H5 : la précision ±2 min tolérée au test §2 est suffisante ; aucune tolérance officielle n'a été communiquée par Ams.

## Scénarios holdout (recette indépendante du dev)

**Holdout 1 — Journée d'été sans crépuscule astronomique + fuseau horaire d'été.**
Ouvrir l'app un jour simulé au 21 juin (heure d'été CEST active). Vérifier que : (a) les 6 horaires s'affichent tous, aucun n'est vide/NaN/undefined ; (b) Fajr et Isha proviennent visiblement de la règle de repli 1/7 de la nuit (calcul manuel de contrôle à partir des heures de lever/coucher affichées, tolérance 1 min) ; (c) les horaires sont en heure d'été (comparaison avec une source externe genre timeanddate.com pour le coucher du soleil à Guyancourt ce jour-là, tolérance 2 min) ; (d) l'ordre Fajr < Chorouq < Dhouhr < Asr < Maghreb < Isha est respecté.

**Holdout 2 — Journée d'hiver + calcul standard + rendu mobile.**
Ouvrir l'app un jour simulé au 21 décembre (heure d'hiver CET) sur un viewport mobile (375×667). Vérifier que : (a) les 6 horaires sont visibles sans scroll horizontal ; (b) Fajr et Isha sont calculés par angle 12°/12° (pas de repli, car nuit longue en hiver) et concordent à ±2 min avec une référence externe (mawaqit.net, méthode UOIF, Guyancourt, 21 décembre) ; (c) Dhouhr = midi solaire vrai + 3 min exactement, vérifiable par calcul de contrôle indépendant ; (d) aucune requête réseau bloquante n'apparaît pendant le calcul (uniquement le chargement initial de la page).
