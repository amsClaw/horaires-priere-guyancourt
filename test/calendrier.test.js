import test from 'node:test';
import assert from 'node:assert/strict';
import { horairesDuCalendrier } from '../src/calendrier.js';

test('retourne les horaires publiés du 23 septembre 2026', () => {
  const horaires = horairesDuCalendrier(new Date('2026-09-23T12:00:00Z'));
  assert.equal(horaires.maghrib, '19:51');
  assert.equal(horaires.isha, '21:21');
});

test('retourne les horaires publiés du solstice d été', () => {
  const horaires = horairesDuCalendrier(new Date('2026-06-21T12:00:00Z'));
  assert.equal(horaires.fajr, '05:00');
  assert.equal(horaires.isha, '23:32');
});

test('retourne l horaire d hiver publié', () => {
  assert.equal(horairesDuCalendrier(new Date('2026-12-21T12:00:00Z')).isha, '19:30');
});

test('retourne les six horaires dans l ordre attendu', () => {
  assert.deepEqual(
    horairesDuCalendrier(new Date('2026-01-01T12:00:00Z')),
    { fajr: '07:24', sunrise: '08:45', dhuhr: '13:00', asr: '14:47', maghrib: '17:09', isha: '19:30' },
  );
});

test('retourne null pour une date hors calendrier ou invalide', () => {
  assert.equal(horairesDuCalendrier(new Date('2027-01-01T12:00:00Z')), null);
  assert.equal(horairesDuCalendrier(new Date('invalid')), null);
});

test('détermine le jour selon l heure de Paris', () => {
  const horaires = horairesDuCalendrier(new Date('2026-09-22T22:30:00Z'));
  assert.equal(horaires.maghrib, '19:51');
});
