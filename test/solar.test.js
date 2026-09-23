import test from 'node:test';
import assert from 'node:assert/strict';
import { equationOfTime, julianDay, solarDeclination, solarNoon } from '../src/solar.js';

test('returns the known Julian Day for 1 January 2000', () => {
  assert.equal(julianDay(new Date('2000-01-01T12:00:00Z')), 2451545);
});

test('declination is near zero at the March equinox', () => {
  assert.ok(Math.abs(solarDeclination(new Date('2024-03-21T12:00:00Z'))) <= 0.5);
});

test('declination is near +23.44 degrees at the June solstice', () => {
  assert.ok(Math.abs(solarDeclination(new Date('2024-06-21T12:00:00Z')) - 23.44) <= 0.3);
});

test('declination is near -23.44 degrees at the December solstice', () => {
  assert.ok(Math.abs(solarDeclination(new Date('2024-12-21T12:00:00Z')) + 23.44) <= 0.3);
});

test('equation of time returns finite minutes', () => {
  const value = equationOfTime(new Date('2024-03-21T12:00:00Z'));
  assert.ok(Number.isFinite(value) && value > -10 && value < 0);
});

test('Guyancourt solar noon on 21 March is between 12:00 and 13:00 CET', () => {
  const noon = solarNoon(new Date('2024-03-21T00:00:00Z'), 2.0761);
  const local = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(noon);
  const [hour, minute] = local.split(':').map(Number);
  assert.ok(hour === 12 && minute >= 0 && minute < 60, `got ${noon.toISOString()}`);
});
