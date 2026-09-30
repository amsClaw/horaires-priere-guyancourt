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
