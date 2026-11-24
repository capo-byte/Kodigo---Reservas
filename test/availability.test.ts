import assert from 'node:assert/strict';
import { test } from 'node:test';
import { localDay, slots } from '../src/availability.js';

test('UTC−6, horario laboral, cadencia, limpieza, descanso y domingo', () => {
  const now = new Date('2026-11-23T13:00:00Z');
  const day = localDay('2026-11-23');
  const rest = [{ starts_minute: 510, ends_minute: 520 }];
  const result = slots(day, now, new Set([Date.parse('2026-11-23T15:00:00Z')]), rest);
  assert.deepEqual(result[0], { time: '08:00', startsAt: '2026-11-23T14:00:00.000Z' });
  assert.equal(result[1].time, '09:30');
  assert.equal(result.at(-1)?.time, '16:30');
  assert.deepEqual(slots(localDay('2026-11-29'), now, new Set()), []);
  assert.ok(slots(localDay('2026-11-26'), now, new Set()).length);
  assert.equal(slots(day, new Date(+now + 1), new Set())[0].time, '08:30');
  assert.equal(slots(day, now, new Set(), [], {
    branch_open: 480, branch_close: 960, labor_open: 490, labor_close: 1000,
  })[0].time, '08:30');
});

test('un mes de calendario inclusivo y ajuste al final de mes', () => {
  const now = new Date('2027-01-31T14:30:00Z');
  assert.ok(slots(localDay('2027-02-27'), now, new Set()).length);
  assert.deepEqual(slots(localDay('2027-03-01'), now, new Set()), []);
  const november = slots(localDay('2026-11-30'), new Date('2026-10-31T14:30:00Z'), new Set());
  assert.equal(november.at(-1)?.time, '08:30');
  assert.throws(() => localDay('2026-02-30'), RangeError);
});
