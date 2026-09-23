import { computePrayerTimes } from './prayerTimes.js';
import { toParisLocalTime } from './timezone.js';

export const GUYANCOURT = Object.freeze({ lat: 48.7717, lon: 2.0761 });

const PRAYER_LABELS = Object.freeze([
  ['fajr', 'Fajr'],
  ['sunrise', 'Chorouq'],
  ['dhuhr', 'Dhouhr'],
  ['asr', 'Asr'],
  ['maghrib', 'Maghreb'],
  ['isha', 'Isha'],
]);

function formatDate(date) {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'full',
    timeZone: 'Europe/Paris',
  }).format(date);
}

export function renderPrayerTimes(date = new Date()) {
  const times = computePrayerTimes(date, GUYANCOURT.lat, GUYANCOURT.lon);
  document.querySelector('#date').textContent = formatDate(date);

  for (const [key] of PRAYER_LABELS) {
    const value = times[key];
    document.querySelector(`#${key}`).textContent = value === null ? '--:--' : toParisLocalTime(value);
  }
}

renderPrayerTimes(new Date());
