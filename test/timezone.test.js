import test from 'node:test';
import assert from 'node:assert/strict';
import { toParisLocalTime } from '../src/timezone.js';

// Source for the expected offsets: IANA Europe/Paris time-zone rules.
// In 2024, standard time is UTC+1 and summer time is UTC+2.
test('converts a January UTC time to Paris standard time (UTC+1)', () => {
  assert.equal(toParisLocalTime(new Date('2024-01-15T12:00:00Z')), '13:00');
});

test('converts a July UTC time to Paris summer time (UTC+2)', () => {
  assert.equal(toParisLocalTime(new Date('2024-07-15T12:00:00Z')), '14:00');
});

test('always formats Paris time with two digits in 24-hour notation', () => {
  assert.equal(toParisLocalTime(new Date('2024-01-15T00:05:00Z')), '01:05');
});

test('rejects an invalid UTC date', () => {
  assert.throws(() => toParisLocalTime(new Date('invalid')), {
    name: 'TypeError',
    message: 'dateUTC must be a valid Date',
  });
});
