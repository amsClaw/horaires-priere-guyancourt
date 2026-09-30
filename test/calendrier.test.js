import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { horairesDuCalendrier } from '../src/calendrier.js';

test('retourne les horaires publiés du 23 septembre 2026', () => {
  const horaires = horairesDuCalendrier(new Date('2026-09-23T12:00:00Z'));
  assert.equal(horaires.maghrib, '19:51');
  assert.equal(horaires.isha, '21:21');
});

test('retourne les horaires publiés du solstice d été', () => {
  const horaires = horairesDuCalendrier(new Date('2026-06-21T12:00:00Z'));
  assert.equal(horaires.fajr, '05:00');
  assert.equal(horaires.isha, '23:32');
});

test('retourne l horaire d hiver publié', () => {
  assert.equal(horairesDuCalendrier(new Date('2026-12-21T12:00:00Z')).isha, '19:30');
});

test('retourne les six horaires dans l ordre attendu', () => {
  assert.deepEqual(
    horairesDuCalendrier(new Date('2026-01-01T12:00:00Z')),
    { fajr: '07:24', sunrise: '08:45', dhuhr: '13:00', asr: '14:47', maghrib: '17:09', isha: '19:30' },
  );
});

test('retourne null pour une date hors calendrier ou invalide', () => {
  assert.equal(horairesDuCalendrier(new Date('2027-01-01T12:00:00Z')), null);
  assert.equal(horairesDuCalendrier(new Date('invalid')), null);
});

test('détermine le jour selon l heure de Paris', () => {
  const horaires = horairesDuCalendrier(new Date('2026-09-22T22:30:00Z'));
  assert.equal(horaires.maghrib, '19:51');
});

// --- Échéance du calendrier publié ------------------------------------------
// Le calendrier Mawaqit est relevé année par année. Sans le fichier de l'année
// suivante, l'app bascule au 1er janvier sur le calcul UOIF 12° (Isha jusqu'à
// environ 1 h d'écart en hiver). Ce test prévient dès le 1er décembre.

const DOSSIER_DATA = new URL('../data/', import.meta.url);

function anneesCouvertes() {
  return readdirSync(DOSSIER_DATA)
    .filter((nom) => /^mosquee-guyancourt-\d{4}\.json$/.test(nom))
    .map((nom) => JSON.parse(readFileSync(new URL(nom, DOSSIER_DATA), 'utf8')).annee);
}

function anneeMoisParis(date) {
  const parts = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Europe/Paris', year: 'numeric', month: 'numeric',
  }).formatToParts(date);
  const v = Object.fromEntries(parts.map(({ type, value }) => [type, Number(value)]));
  return { annee: v.year, mois: v.month };
}

/** Lève une erreur explicite si l'année suivante n'est pas couverte à temps. */
function verifierEcheanceCalendrier(maintenant, annees) {
  const derniere = Math.max(...annees);
  const { annee, mois } = anneeMoisParis(maintenant);
  const echeanceAtteinte = annee > derniere || (annee === derniere && mois >= 12);
  if (echeanceAtteinte) {
    throw new Error(
      `Calendrier de la mosquée manquant pour ${derniere + 1} : `
      + `data/mosquee-guyancourt-${derniere}.json s'arrête au 31/12/${derniere}. `
      + `Relever le calendrier Mawaqit ${derniere + 1} de la Mosquée de Guyancourt `
      + `(mawaqit.net, ID 22420) et l'ajouter dans data/mosquee-guyancourt-${derniere + 1}.json, `
      + 'sinon l\'app affichera les horaires calculés (Isha jusqu\'à environ 1 h d\'écart).',
    );
  }
}

test('échéance : le calendrier de l année suivante est relevé avant le 1er décembre', () => {
  const annees = anneesCouvertes();
  assert.ok(annees.length > 0, 'aucun calendrier dans data/');
  verifierEcheanceCalendrier(new Date(), annees);
});

test('échéance : échoue le 01/12/2026 sans calendrier 2027, avec un message qui dit quoi faire', () => {
  const premierDecembre = new Date('2026-11-30T23:00:00Z'); // 01/12/2026 00:00 à Paris
  assert.throws(
    () => verifierEcheanceCalendrier(premierDecembre, [2026]),
    /Calendrier de la mosquée manquant pour 2027.*Relever le calendrier Mawaqit 2027/s,
  );
  assert.throws(() => verifierEcheanceCalendrier(new Date('2027-01-15T12:00:00Z'), [2026]));
});

test('échéance : passe le 30/11/2026, ou le 01/12/2026 si 2027 est relevé', () => {
  verifierEcheanceCalendrier(new Date('2026-11-30T22:59:00Z'), [2026]);
  verifierEcheanceCalendrier(new Date('2026-11-30T23:00:00Z'), [2026, 2027]);
});

// --- Intégrité des calendriers publiés --------------------------------------
// Chaque fichier data/mosquee-guyancourt-AAAA.json est contrôlé jour par jour :
// une faute de frappe (« 5:00 ») ou deux horaires inversés font échouer ce test.

const HEURE_HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/;

function fichiersCalendrier() {
  return readdirSync(DOSSIER_DATA)
    .filter((nom) => /^mosquee-guyancourt-\d{4}\.json$/.test(nom))
    .map((nom) => ({ nom, contenu: JSON.parse(readFileSync(new URL(nom, DOSSIER_DATA), 'utf8')) }));
}

function estBissextile(annee) {
  return (annee % 4 === 0 && annee % 100 !== 0) || annee % 400 === 0;
}

function joursDansLeMois(annee, mois) {
  return new Date(Date.UTC(annee, mois, 0)).getUTCDate();
}

test('intégrité : champ annee cohérent avec le nom du fichier', () => {
  const fichiers = fichiersCalendrier();
  assert.ok(fichiers.length > 0, 'aucun calendrier dans data/');
  for (const { nom, contenu } of fichiers) {
    assert.equal(contenu.annee, Number(nom.match(/(\d{4})/)[1]), `${nom} : champ annee`);
    assert.equal(contenu.mois.length, 12, `${nom} : 12 mois attendus`);
  }
});

test('intégrité : nombre de jours de chaque mois conforme à l année', () => {
  for (const { nom, contenu } of fichiersCalendrier()) {
    contenu.mois.forEach((jours, index) => {
      const mois = index + 1;
      const attendus = joursDansLeMois(contenu.annee, mois);
      let cles = Object.keys(jours).map(Number).sort((a, b) => a - b);
      // Mawaqit publie toujours un 29 février, y compris les années non
      // bissextiles : cette entrée est inatteignible (le 29/02 n'existe pas).
      if (mois === 2 && !estBissextile(contenu.annee) && cles.at(-1) === 29) cles = cles.slice(0, -1);
      assert.deepEqual(
        cles,
        Array.from({ length: attendus }, (_, i) => i + 1),
        `${nom} : mois ${mois} doit compter les jours 1 à ${attendus}`,
      );
    });
  }
});

test('intégrité : février compte 29 jours les années bissextiles', () => {
  for (const { nom, contenu } of fichiersCalendrier()) {
    if (estBissextile(contenu.annee)) {
      assert.ok(contenu.mois[1]['29'], `${nom} : 29 février manquant`);
    }
  }
});

test('intégrité : chaque jour a six horaires HH:MM strictement croissants', () => {
  let joursControles = 0;
  for (const { nom, contenu } of fichiersCalendrier()) {
    contenu.mois.forEach((jours, index) => {
      for (const [jour, horaires] of Object.entries(jours)) {
        const ou = `${nom} : ${jour}/${index + 1}`;
        assert.equal(horaires.length, 6, `${ou} : six horaires attendus`);
        for (const h of horaires) assert.match(h, HEURE_HH_MM, `${ou} : « ${h} » n'est pas au format HH:MM`);
        for (let i = 1; i < 6; i += 1) {
          assert.ok(horaires[i - 1] < horaires[i], `${ou} : ${horaires[i - 1]} devrait précéder ${horaires[i]}`);
        }
        joursControles += 1;
      }
    });
  }
  assert.ok(joursControles >= 365);
});
