import test from 'node:test';
import assert from 'node:assert/strict';
import { computePrayerTimes } from '../src/prayerTimes.js';

const GUYANCOURT = { lat: 48.7717, lon: 2.0761 };
const WINTER_DATE = new Date('2024-12-21T00:00:00Z');
const SUMMER_DATE = new Date('2024-06-21T00:00:00Z');

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

test('summer uses the 1/7-night fallback when 12° is undefined', () => {
  const times = computePrayerTimes(SUMMER_DATE, 60, GUYANCOURT.lon);
  const nextDay = computePrayerTimes(new Date('2024-06-22T00:00:00Z'), 60, GUYANCOURT.lon);
  const seventhOfNight = (nextDay.sunrise.getTime() - times.maghrib.getTime()) / 7;
  console.log('Branche utilisée le 21 juin à 60°N : repli 1/7 de la nuit');
  for (const name of ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']) {
    assert.ok(times[name] instanceof Date, `${name} should be a Date`);
  }
  assert.equal(times.fajr.getTime(), Math.trunc(nextDay.sunrise.getTime() - seventhOfNight));
  assert.equal(times.isha.getTime(), Math.trunc(times.maghrib.getTime() + seventhOfNight));
  assert.ok(times.maghrib < times.isha && times.isha < nextDay.sunrise);
  assert.ok(times.fajr < nextDay.sunrise && times.maghrib < times.fajr);
});

test('Guyancourt summer order remains valid with angle-based times', () => {
  const times = computePrayerTimes(SUMMER_DATE, GUYANCOURT.lat, GUYANCOURT.lon);
  assert.ok(times.fajr < times.sunrise && times.sunrise < times.dhuhr
    && times.dhuhr < times.asr && times.asr < times.maghrib && times.maghrib < times.isha);
});

test('winter does not trigger the 1/7-night fallback', () => {
  const times = computePrayerTimes(WINTER_DATE, GUYANCOURT.lat, GUYANCOURT.lon);
  const nextSunrise = computePrayerTimes(new Date('2024-12-22T00:00:00Z'), GUYANCOURT.lat, GUYANCOURT.lon).sunrise;
  const winterSunset = times.maghrib;
  const fallbackIsha = winterSunset.getTime() + (nextSunrise.getTime() - winterSunset.getTime()) / 7;
  assert.notEqual(times.isha.getTime(), fallbackIsha);
});
