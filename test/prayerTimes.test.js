import test from 'node:test';
import assert from 'node:assert/strict';
import { computePrayerTimes } from '../src/prayerTimes.js';

const GUYANCOURT = { lat: 48.7717, lon: 2.0761 };
const WINTER_DATE = new Date('2024-12-21T00:00:00Z');

function minutesSinceMidnight(date) {
  return date.getUTCHours() * 60 + date.getUTCMinutes() + date.getUTCSeconds() / 60;
}

test('computes all angle-based prayer times as UTC Dates in winter', () => {
  const times = computePrayerTimes(WINTER_DATE, GUYANCOURT.lat, GUYANCOURT.lon);
  for (const name of ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']) {
    assert.ok(times[name] instanceof Date, `${name} should be a Date`);
    assert.ok(!Number.isNaN(times[name].getTime()), `${name} should be valid`);
  }
});

test('Dhouhr is exactly true solar noon plus three minutes', () => {
  const times = computePrayerTimes(WINTER_DATE, GUYANCOURT.lat, GUYANCOURT.lon);
  const noonMinutes = minutesSinceMidnight(times.dhuhr);
  // solarNoon for this date/location is 11:49:59 UTC; the prescribed margin is 3 min.
  assert.equal(Math.floor(noonMinutes * 60), 11 * 3600 + 52 * 60 + 59);
});

test('winter order is Fajr < sunrise < Dhouhr < Asr < Maghreb', () => {
  const { fajr, sunrise, dhuhr, asr, maghrib } = computePrayerTimes(WINTER_DATE, GUYANCOURT.lat, GUYANCOURT.lon);
  assert.ok(fajr < sunrise && sunrise < dhuhr && dhuhr < asr && asr < maghrib);
});

test('winter 12° Fajr and Isha match the cited external reference within two minutes', () => {
  const { fajr, isha } = computePrayerTimes(WINTER_DATE, GUYANCOURT.lat, GUYANCOURT.lon);
  // Reference frozen from mawaqit.net, Guyancourt, UOIF 12°, 21 Dec 2024:
  // Fajr 07:25 CET (06:25 UTC), Isha 18:15 CET (17:15 UTC), ±2 min.
  const fajrReference = Date.parse('2024-12-21T06:25:00Z');
  const ishaReference = Date.parse('2024-12-21T17:15:00Z');
  assert.ok(Math.abs(fajr.getTime() - fajrReference) <= 2 * 60 * 1000);
  assert.ok(Math.abs(isha.getTime() - ishaReference) <= 2 * 60 * 1000);
});
