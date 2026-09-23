import test from 'node:test';
import assert from 'node:assert/strict';
import { julianDay } from '../src/solar.js';

test('returns the known Julian Day for 1 January 2000', () => {
  assert.equal(julianDay(new Date('2000-01-01T12:00:00Z')), 2451545);
});
