/**
 * Return the Julian Day for a JavaScript Date.
 *
 * Julian days start at noon UTC, so the Unix epoch is JD 2440587.5.
 * @param {Date} date
 * @returns {number}
 */
export function julianDay(date) {
  assertValidDate(date);
  return date.getTime() / 86_400_000 + 2_440_587.5;
}

const TAU = 2 * Math.PI;

function assertValidDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new TypeError('date must be a valid Date');
  }
}

/** Return the Sun's declination in degrees. */
export function solarDeclination(date) {
  assertValidDate(date);
  const startOfYear = Date.UTC(date.getUTCFullYear(), 0, 1);
  const dayOfYear = Math.floor((date.getTime() - startOfYear) / 86_400_000) + 1;
  const timeOfDay = (date.getUTCHours() + date.getUTCMinutes() / 60
    + date.getUTCSeconds() / 3_600 + date.getUTCMilliseconds() / 3_600_000);
  const gamma = TAU / 365 * (dayOfYear - 1 + (timeOfDay - 12) / 24);
  return (0.006918 - 0.399912 * Math.cos(gamma) + 0.070257 * Math.sin(gamma)
    - 0.006758 * Math.cos(2 * gamma) + 0.000907 * Math.sin(2 * gamma)
    - 0.002697 * Math.cos(3 * gamma) + 0.00148 * Math.sin(3 * gamma)) * 180 / Math.PI;
}

/** Return the equation of time in minutes. */
export function equationOfTime(date) {
  assertValidDate(date);
  const startOfYear = Date.UTC(date.getUTCFullYear(), 0, 1);
  const dayOfYear = Math.floor((date.getTime() - startOfYear) / 86_400_000) + 1;
  const timeOfDay = (date.getUTCHours() + date.getUTCMinutes() / 60
    + date.getUTCSeconds() / 3_600 + date.getUTCMilliseconds() / 3_600_000);
  const gamma = TAU / 365 * (dayOfYear - 1 + (timeOfDay - 12) / 24);
  return 229.18 * (0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma)
    - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma));
}

/** Return true solar noon as a UTC Date; longitude is positive east. */
export function solarNoon(date, lon) {
  assertValidDate(date);
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
    throw new RangeError('longitude must be between -180 and 180 degrees');
  }
  const dayStart = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const minutes = 720 - 4 * lon - equationOfTime(new Date(dayStart));
  return new Date(dayStart + minutes * 60_000);
}
