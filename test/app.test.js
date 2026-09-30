import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  demarrer, delaiJusquauProchainMinuitParis, renderPrayerTimes, AVERTISSEMENT_REPLI,
} from '../src/app.js';

const HEURE = 3600 * 1000;

function fauxEnvironnement() {
  const elements = new Map();
  const ecouteursDoc = {};
  const ecouteursWin = {};
  const minuteurs = [];
  const doc = {
    visibilityState: 'visible',
    querySelector(selecteur) {
      if (!elements.has(selecteur)) elements.set(selecteur, { textContent: '' });
      return elements.get(selecteur);
    },
    addEventListener(type, fn) { ecouteursDoc[type] = fn; },
  };
  const win = {
    addEventListener(type, fn) { ecouteursWin[type] = fn; },
    setTimeout(fn, delai) { minuteurs.push({ fn, delai, actif: true }); return minuteurs.length - 1; },
    clearTimeout(id) { minuteurs[id].actif = false; },
  };
  const texte = (id) => elements.get(`#${id}`)?.textContent;
  return { doc, win, texte, ecouteursDoc, ecouteursWin, minuteurs };
}

test('un onglet ouvert le 30/09 à 23:50 affiche le 1er octobre après minuit', () => {
  const env = fauxEnvironnement();
  let maintenant = new Date('2026-09-30T21:50:00Z'); // 23:50 à Paris
  demarrer(env.doc, env.win, () => maintenant);

  assert.equal(env.texte('date'), 'mercredi 30 septembre 2026');
  assert.equal(env.texte('fajr'), '06:37');

  maintenant = new Date('2026-09-30T22:05:00Z'); // 01/10 à 00:05 à Paris
  env.doc.visibilityState = 'visible';
  env.ecouteursDoc.visibilitychange();

  assert.equal(env.texte('date'), 'jeudi 1 octobre 2026');
  assert.deepEqual(
    ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'].map(env.texte),
    ['06:39', '07:51', '13:46', '16:53', '19:34', '21:04'],
  );
  assert.equal(env.texte('source'), 'Source : Mosquée de Guyancourt (Mawaqit)');
});

test('le minuteur de minuit et pageshow rafraîchissent aussi', () => {
  const env = fauxEnvironnement();
  let maintenant = new Date('2026-09-30T21:50:00Z');
  demarrer(env.doc, env.win, () => maintenant);

  const premier = env.minuteurs[0];
  assert.equal(premier.delai, 10 * 60 * 1000 + 5000);

  maintenant = new Date(maintenant.getTime() + premier.delai);
  premier.fn();
  assert.equal(env.texte('date'), 'jeudi 1 octobre 2026');
  assert.equal(env.minuteurs.length, 2, 'un nouveau minuteur est programmé après le rendu');

  maintenant = new Date('2026-10-02T06:00:00Z');
  env.ecouteursWin.pageshow({ persisted: true });
  assert.equal(env.texte('date'), 'vendredi 2 octobre 2026');
  assert.equal(env.minuteurs.filter((m) => m.actif).length, 1, 'un seul minuteur actif');
});

test('aucun rafraîchissement quand la page devient cachée', () => {
  const env = fauxEnvironnement();
  let maintenant = new Date('2026-09-30T21:50:00Z');
  demarrer(env.doc, env.win, () => maintenant);
  maintenant = new Date('2026-09-30T22:05:00Z');
  env.doc.visibilityState = 'hidden';
  env.ecouteursDoc.visibilitychange();
  assert.equal(env.texte('date'), 'mercredi 30 septembre 2026');
});

test('délai jusqu au prochain minuit de Paris, jour ordinaire', () => {
  assert.equal(delaiJusquauProchainMinuitParis(new Date('2026-09-30T21:50:00Z')), 10 * 60 * 1000);
  assert.equal(delaiJusquauProchainMinuitParis(new Date('2026-01-15T23:00:00Z')), 24 * HEURE);
});

test('délai jusqu au prochain minuit de Paris, nuit du passage à l heure d hiver (25/10/2026)', () => {
  // 24/10 à 12:00 Paris (UTC+2) -> minuit du 25/10 = 24/10 22:00 UTC : 12 h.
  assert.equal(delaiJusquauProchainMinuitParis(new Date('2026-10-24T10:00:00Z')), 12 * HEURE);
  // 25/10 à 00:00:01 Paris (UTC+2) : la journée dure 25 h -> minuit du 26/10 = 25/10 23:00 UTC.
  assert.equal(
    delaiJusquauProchainMinuitParis(new Date('2026-10-24T22:00:01Z')),
    25 * HEURE - 1000,
  );
  // 25/10 à 12:00 Paris (déjà UTC+1) -> 12 h.
  assert.equal(delaiJusquauProchainMinuitParis(new Date('2026-10-25T11:00:00Z')), 12 * HEURE);
});

test('délai jusqu au prochain minuit de Paris, passage à l heure d été (29/03/2026)', () => {
  // 29/03 à 00:00:01 Paris (UTC+1) : la journée dure 23 h.
  assert.equal(
    delaiJusquauProchainMinuitParis(new Date('2026-03-28T23:00:01Z')),
    23 * HEURE - 1000,
  );
});

test('avertissement visible quand le calendrier de la mosquée manque (2027)', () => {
  const env = fauxEnvironnement();
  demarrer(env.doc, env.win, () => new Date('2027-01-01T11:00:00Z'));
  assert.equal(env.texte('avertissement'), AVERTISSEMENT_REPLI);
  assert.equal(
    AVERTISSEMENT_REPLI,
    'Calendrier de la mosquée non disponible pour cette date : horaires calculés, '
    + 'ils peuvent différer de ceux de la mosquée (Isha jusqu\'à environ 1 h).',
  );
  assert.equal(env.doc.querySelector('#avertissement').hidden, false);
  assert.equal(env.texte('source'), 'Source : calcul astronomique (UOIF 12°)');
});

test('aucun avertissement quand le calendrier de la mosquée couvre la date (2026)', () => {
  const env = fauxEnvironnement();
  let maintenant = new Date('2027-01-01T11:00:00Z');
  demarrer(env.doc, env.win, () => maintenant);
  maintenant = new Date('2026-12-31T11:00:00Z');
  env.ecouteursWin.pageshow({ persisted: true });
  assert.equal(env.texte('avertissement'), '');
  assert.equal(env.doc.querySelector('#avertissement').hidden, true);
  assert.equal(env.texte('isha'), '19:30');
});

// --- Écran : horaires publiés, sinon calcul ---------------------------------

const RACINE = new URL('..', import.meta.url);
const CALENDRIER_2026 = JSON.parse(
  readFileSync(new URL('data/mosquee-guyancourt-2026.json', RACINE), 'utf8'),
);
const CLES = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

function fauxDocument() {
  const elements = new Map();
  return {
    querySelector(selecteur) {
      if (!elements.has(selecteur)) elements.set(selecteur, { textContent: '' });
      return elements.get(selecteur);
    },
    texte(id) { return elements.get(`#${id}`)?.textContent; },
    tousLesTextes() { return [...elements.values()].map((e) => String(e.textContent)); },
  };
}

test('écran : chaque jour de 2026 affiche les six horaires publiés par la mosquée', () => {
  for (let jour = Date.UTC(2026, 0, 1, 11); jour < Date.UTC(2027, 0, 1); jour += 24 * HEURE) {
    const date = new Date(jour);
    const doc = fauxDocument();
    renderPrayerTimes(date, doc);
    const publies = CALENDRIER_2026.mois[date.getUTCMonth()][String(date.getUTCDate())];
    assert.deepEqual(CLES.map((c) => doc.texte(c)), publies, date.toISOString());
    assert.equal(doc.texte('source'), 'Source : Mosquée de Guyancourt (Mawaqit)');
  }
});

test('écran : une date 2027 affiche des horaires calculés HH:MM et la source calcul', () => {
  for (const iso of ['2027-01-01T11:00:00Z', '2027-06-21T11:00:00Z', '2027-09-23T11:00:00Z']) {
    const doc = fauxDocument();
    renderPrayerTimes(new Date(iso), doc);
    for (const c of CLES) assert.match(doc.texte(c), /^\d{2}:\d{2}$/, `${iso} ${c}`);
    assert.equal(doc.texte('source'), 'Source : calcul astronomique (UOIF 12°)');
    for (const t of doc.tousLesTextes()) assert.doesNotMatch(t, /undefined|NaN/, iso);
  }
});

test('écran : aucune valeur « undefined » ou « NaN » avec le calendrier publié', () => {
  const doc = fauxDocument();
  renderPrayerTimes(new Date('2026-09-23T11:00:00Z'), doc);
  for (const t of doc.tousLesTextes()) assert.doesNotMatch(t, /undefined|NaN/);
});
