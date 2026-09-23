/**
 * Convert a UTC instant to its Europe/Paris local clock time.
 *
 * Intl.DateTimeFormat delegates daylight-saving rules to the runtime's
 * time-zone database, so the offset is not hard-coded (UTC+1/UTC+2).
 *
 * @param {Date} dateUTC a valid UTC instant
 * @returns {string} local time formatted as HH:MM, in 24-hour notation
 */
export function toParisLocalTime(dateUTC) {
  if (!(dateUTC instanceof Date) || Number.isNaN(dateUTC.getTime())) {
    throw new TypeError('dateUTC must be a valid Date');
  }

  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Europe/Paris',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(dateUTC);
}
