/**
 * Return the Julian Day for a JavaScript Date.
 *
 * Julian days start at noon UTC, so the Unix epoch is JD 2440587.5.
 * @param {Date} date
 * @returns {number}
 */
export function julianDay(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new TypeError('date must be a valid Date');
  }

  return date.getTime() / 86_400_000 + 2_440_587.5;
}
