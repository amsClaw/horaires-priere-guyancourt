const NOMS_HORAIRES = Object.freeze(['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']);

function dateDansParis(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;

  const parts = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(date);
  const valeurs = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return {
    annee: Number(valeurs.year),
    mois: Number(valeurs.month),
    jour: Number(valeurs.day),
  };
}

export function horairesDuCalendrier(date, calendrier) {
  const dateParis = dateDansParis(date);
  if (!dateParis || dateParis.annee !== calendrier?.annee) return null;

  const horaires = calendrier.mois?.[dateParis.mois - 1]?.[String(dateParis.jour)];
  if (!Array.isArray(horaires) || horaires.length !== NOMS_HORAIRES.length
      || !horaires.every((h) => typeof h === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(h))) {
    return null;
  }

  return Object.fromEntries(NOMS_HORAIRES.map((nom, index) => [nom, horaires[index]]));
}
