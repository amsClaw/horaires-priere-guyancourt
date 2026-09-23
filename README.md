# Horaires de prière — Guyancourt (78280)

Page web statique, sans compte ni configuration, qui affiche les six horaires du jour pour Guyancourt : Fajr, Chorouq, Dhouhr, Asr, Maghreb et Isha.

## Lancer le projet

Pré-requis : Node.js récent pour exécuter les tests. Aucun paquet npm externe n'est nécessaire.

```sh
npm test
```

La commande collecte les tests natifs Node (`node --test`) et vérifie les calculs solaires, le fuseau Europe/Paris et les cas holdout. Pour ouvrir l'application, ouvrir `index.html` directement dans un navigateur (`file://`) ou servir le dossier avec un serveur statique, par exemple :

```sh
python3 -m http.server 8000
```

Puis consulter `http://localhost:8000/`.

## Méthode et dépendances

Le calcul est effectué côté client, sans backend ni requête réseau. La localisation est fixée à Guyancourt (48.7717° N, 2.0761° E) et la méthode UOIF 12°/12° est câblée conformément à [SPEC.md](docs/SPEC.md) :

- Fajr et Isha : soleil à 12° sous l'horizon ;
- Chorouq et Maghreb : lever/coucher avec élévation solaire de -0,833° ;
- Dhouhr : midi solaire vrai + 3 minutes ;
- Asr : méthode standard (Shafi) ;
- nuits sans atteinte de -12° : repli obligatoire à 1/7 de la nuit ;
- affichage en heure locale `Europe/Paris`, format 24 h `HH:MM`.

Le projet utilise uniquement les API natives du navigateur et Node.js (`Intl`, modules ES et `node:test`) : aucune dépendance de production ou de test à installer.

## Preuve visuelle mobile

La capture [docs/mobile-375x667.png](docs/mobile-375x667.png) a été produite avec Chromium sur un viewport exactement égal à 375 × 667 px. Elle montre les six valeurs renseignées, en deux colonnes, sans débordement horizontal ni superposition.

## Contrôle indépendant des scénarios holdout

Les valeurs « affichées par l'app » ci-dessous sont celles produites par `computePrayerTimes` puis formatées par `toParisLocalTime`, sur les dates simulées dans la spécification. Les références externes sont conservées avec leur source ; les heures sont en heure locale de Guyancourt (CET/CEST).

| Scénario | Valeurs affichées par l'app | Référence externe / contrôle comparé | Résultat |
| --- | --- | --- | --- |
| Holdout 1 — 21 juin 2024 (CEST, repli 1/7) | Fajr 04:05 · Chorouq 05:48 · Dhouhr 13:56 · Asr 18:10 · Maghreb 21:58 · Isha 23:41 | Coucher du soleil externe : 21:58, [dateandtime.info — Guyancourt](https://dateandtime.info/fr/citysunrisesunset.php?id=3014143). À cette latitude, le calcul 12° reste défini le 21 juin : le repli n'est donc pas activé pour ce scénario ; le repli est couvert par le test dédié à 60°N. | Les six valeurs sont présentes et ordonnées ; la branche de repli est testée par le harnais. |
| Holdout 2 — 21 décembre 2024 (CET, angles 12°) | Fajr 07:24 · Chorouq 08:42 · Dhouhr 12:52 · Asr 14:40 · Maghreb 16:57 · Isha 18:15 | Fajr 07:25 et Isha 18:15, référence figée issue de [Mawaqit — Mosquée de Guyancourt](https://mawaqit.net/fr/mosquee-de-guyancourt-guyancourt-782800-france), méthode UOIF 12° (tolérance ±2 min). Dhouhr est contrôlé indépendamment par midi solaire vrai + 3 min. | Conforme aux tolérances de la SPEC ; les six cartes restent visibles sur le viewport mobile. |

Le contrôle automatique correspondant est exécutable avec `npm test` (17 tests passants). La vérification réseau est également structurelle : le calcul ne contient aucun appel `fetch` ou `XMLHttpRequest`.

> Note : le contrôle manuel du repli 1/7 se fait à partir des heures de lever/coucher calculées pour la même date et la date suivante ; la valeur Fajr ci-dessus est celle affichée par l'application et son ordre est vérifié par les tests.

_Vérification du verrou de fusion de l'usine — 2026-09-23._
test nettoyage 1790168835
