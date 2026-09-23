import { equationOfTime, solarDeclination, solarNoon } from './solar.js';

const RAD = Math.PI / 180;
const SUNRISE_ALTITUDE = -0.833;

function dateAtUtcMidnight(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function eventMinutes(date, lat, lon, altitude, rising) {
  const day = dateAtUtcMidnight(date);
  const declination = solarDeclination(new Date(day.getTime() + 12 * 60 * 60 * 1000));
  const cosHourAngle = (Math.sin(altitude * RAD) - Math.sin(lat * RAD) * Math.sin(declination * RAD))
    / (Math.cos(lat * RAD) * Math.cos(declination * RAD));
  if (cosHourAngle < -1 || cosHourAngle > 1) return null;
  const hourAngle = Math.acos(cosHourAngle) / RAD;
  const noonMinutes = 720 - 4 * lon - equationOfTime(new Date(day.getTime() + 12 * 60 * 60 * 1000));
  return noonMinutes + (rising ? -1 : 1) * hourAngle * 4;
}

function eventDate(date, lat, lon, altitude, rising) {
  const minutes = eventMinutes(date, lat, lon, altitude, rising);
  if (minutes === null) return null;
  return new Date(dateAtUtcMidnight(date).getTime() + minutes * 60 * 1000);
}

function asrDate(date, lat, lon) {
  const day = dateAtUtcMidnight(date);
  const declination = solarDeclination(new Date(day.getTime() + 12 * 60 * 60 * 1000));
  const altitude = Math.atan(1 / (1 + Math.tan(Math.abs((lat - declination) * RAD)))) / RAD;
  return eventDate(date, lat, lon, altitude, false);
}

/**
 * Compute the five angle-based prayer times in UTC.
 * Isha deliberately remains null when the 12° solar depression is undefined;
 * the 1/7-night fallback belongs to the next story.
 */
export function computePrayerTimes(date, lat, lon) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) throw new TypeError('date must be a valid Date');
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new TypeError('latitude and longitude must be finite numbers');
  return {
    fajr: eventDate(date, lat, lon, -12, true),
    sunrise: eventDate(date, lat, lon, SUNRISE_ALTITUDE, true),
    dhuhr: new Date(solarNoon(date, lon).getTime() + 3 * 60 * 1000),
    asr: asrDate(date, lat, lon),
    maghrib: eventDate(date, lat, lon, SUNRISE_ALTITUDE, false),
    isha: eventDate(date, lat, lon, -12, false),
  };
}