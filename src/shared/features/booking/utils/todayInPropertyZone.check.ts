/**
 * Self-check for the property-day boundary (BookingSystemDesign.md §3). Every booking
 * transition — check-in, check-out, expiry, both cancellation windows — is measured against
 * this, so an hour of drift moves real money and real stays by a whole day.
 *
 * ponytail: plain asserts, no test framework — run it with `bun src/shared/features/booking/utils/todayInPropertyZone.check.ts`
 */
import { strict as assert } from 'node:assert';

import { todayIsoInZone, todayIsoUtc } from './daysUntilCheckIn';

const BELGRADE = 'Europe/Belgrade';

// The bug this exists to prevent: late-evening UTC is already tomorrow in Belgrade.
// 2026-06-10T23:30Z = 2026-06-11 01:30 in Belgrade (CEST, UTC+2).
const lateEvening = Date.parse('2026-06-10T23:30:00Z');
assert.equal(todayIsoUtc(lateEvening), '2026-06-10', 'UTC still says the 10th');
assert.equal(todayIsoInZone(BELGRADE, lateEvening), '2026-06-11', 'Belgrade is already the 11th');

// Early-morning UTC is the same day in Belgrade — no false shift the other way.
const earlyMorning = Date.parse('2026-06-10T06:00:00Z');
assert.equal(todayIsoInZone(BELGRADE, earlyMorning), '2026-06-10');

// Winter (CET, UTC+1): the boundary moves with DST, which is exactly why this uses Intl
// rather than a fixed offset.
const winterLate = Date.parse('2026-01-15T23:30:00Z');
assert.equal(todayIsoInZone(BELGRADE, winterLate), '2026-01-16', 'CET +1 still rolls over');
const winterEdge = Date.parse('2026-01-15T22:30:00Z');
assert.equal(todayIsoInZone(BELGRADE, winterEdge), '2026-01-15', 'CET: 23:30 local, same day');
// The same instant in summer (UTC+2) WOULD be the next day — the DST difference itself.
const summerEdge = Date.parse('2026-07-15T22:30:00Z');
assert.equal(todayIsoInZone(BELGRADE, summerEdge), '2026-07-16', 'CEST: 00:30 local, next day');

// Format is always zero-padded ISO — these strings get compared lexicographically.
const singleDigit = Date.parse('2026-03-05T10:00:00Z');
assert.equal(todayIsoInZone(BELGRADE, singleDigit), '2026-03-05');
assert.match(todayIsoInZone(BELGRADE, Date.now()), /^\d{4}-\d{2}-\d{2}$/);

// Month and year rollover across the zone offset.
assert.equal(todayIsoInZone(BELGRADE, Date.parse('2026-12-31T23:30:00Z')), '2027-01-01');

console.log('todayInPropertyZone: all checks passed');
