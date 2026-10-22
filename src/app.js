import { computePrayerTimes } from './prayerTimes.js';
import { toParisLocalTime } from './timezone.js';
import { horairesDuCalendrier } from './calendrier.js';

export const GUYANCOURT = Object.freeze({ lat: 48.7717, lon: 2.0761 });

const PRAYER_LABELS = Object.freeze([
  ['fajr', 'Fajr'],
  ['sunrise', 'Chorouq'],
  ['dhuhr', 'Dhouhr'],
  ['asr', 'Asr'],
  ['maghrib', 'Maghreb'],
  ['isha', 'Isha'],
]);

export const AVERTISSEMENT_REPLI =
  'Calendrier de la mosquée non disponible pour cette date : horaires calculés, '
  + 'ils peuvent différer de ceux de la mosquée (Isha jusqu\'à environ 1 h).';

function formatDate(date) {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'full',
    timeZone: 'Europe/Paris',
  }).format(date);
}

export function renderPrayerTimes(date = new Date(), doc = globalThis.document, calendrier = null) {
  const horairesPublies = horairesDuCalendrier(date, calendrier);
  const times = horairesPublies ?? computePrayerTimes(date, GUYANCOURT.lat, GUYANCOURT.lon);
  doc.querySelector('#date').textContent = formatDate(date);

  for (const [key] of PRAYER_LABELS) {
    const value = times[key];
    doc.querySelector(`#${key}`).textContent = value === null ? '--:--' : (
      horairesPublies ? value : toParisLocalTime(value)
    );
  }

  doc.querySelector('#source').textContent = horairesPublies
    ? 'Source : Mosquée de Guyancourt (Mawaqit)'
    : 'Source : calcul astronomique (UOIF 12°)';

  const avertissement = doc.querySelector('#avertissement');
  avertissement.textContent = horairesPublies ? '' : AVERTISSEMENT_REPLI;
  avertissement.hidden = Boolean(horairesPublies);
  doc.querySelector('#navigateur-incompatible').hidden = true;
}

// Marge après minuit : le minuteur ne doit pas se déclencher à 23:59:59.
const MARGE_APRES_MINUIT_MS = 5000;

function partiesParis(instantMs) {
  const parts = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(new Date(instantMs));
  const v = Object.fromEntries(parts.map(({ type, value }) => [type, Number(value)]));
  return { annee: v.year, mois: v.month, jour: v.day, heure: v.hour, minute: v.minute, seconde: v.second };
}

// Décalage (ms) de l'heure de Paris par rapport à UTC à un instant donné.
function decalageParis(instantMs) {
  const p = partiesParis(instantMs);
  const commeUTC = Date.UTC(p.annee, p.mois - 1, p.jour, p.heure, p.minute, p.seconde);
  return commeUTC - Math.floor(instantMs / 1000) * 1000;
}

/**
 * Délai (ms) entre `maintenant` et le prochain minuit à l'heure de Paris.
 * Le décalage UTC+1/UTC+2 est relu au minuit visé : les jours de changement
 * d'heure durent 23 h ou 25 h.
 */
export function delaiJusquauProchainMinuitParis(maintenant) {
  const instant = maintenant.getTime();
  const p = partiesParis(instant);
  const minuitCommeUTC = Date.UTC(p.annee, p.mois - 1, p.jour + 1);
  let minuit = minuitCommeUTC - decalageParis(minuitCommeUTC);
  minuit = minuitCommeUTC - decalageParis(minuit);
  return minuit - instant;
}

/**
 * Affiche les horaires du jour puis les tient à jour : au prochain minuit de
 * Paris, au retour sur l'onglet et à la restauration depuis le cache.
 */
export async function demarrer(doc, win, maintenant = () => new Date()) {
  let minuteur = null;
  const calendriers = new Map();

  function chargerCalendrier(annee) {
    if (!calendriers.has(annee)) {
      const entree = { calendrier: null, chargement: null };
      calendriers.set(annee, entree);
      entree.chargement = (async () => {
        try {
          const reponse = await win.fetch(`./data/mosquee-guyancourt-${annee}.json`);
          if (reponse.ok) entree.calendrier = await reponse.json();
        } catch {
          // Réseau ou JSON invalide : le calcul et son avertissement restent affichés.
        }
      })();
    }
    return calendriers.get(annee);
  }

  async function rafraichir() {
    const date = maintenant();
    const annee = partiesParis(date.getTime()).annee;
    // Afficher immédiatement, même si le réseau ne répond jamais.
    renderPrayerTimes(date, doc, calendriers.get(annee)?.calendrier);
    if (minuteur !== null) win.clearTimeout(minuteur);
    minuteur = win.setTimeout(
      rafraichir,
      delaiJusquauProchainMinuitParis(date) + MARGE_APRES_MINUIT_MS,
    );
    const entree = chargerCalendrier(annee);
    await entree.chargement;
    const dateActuelle = maintenant();
    // Une ancienne requête ne doit pas écraser le rendu d'une nouvelle année.
    if (partiesParis(dateActuelle.getTime()).annee === annee) {
      renderPrayerTimes(dateActuelle, doc, entree.calendrier);
    }
  }

  doc.addEventListener('visibilitychange', () => {
    if (doc.visibilityState === 'visible') return rafraichir();
  });
  win.addEventListener('pageshow', rafraichir);

  await rafraichir();
  return rafraichir;
}

if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  demarrer(document, window);
}
