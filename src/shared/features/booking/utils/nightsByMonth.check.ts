/**
 * Self-check for the occupancy split. This runs at WRITE time and its output is permanent:
 * a wrong split lands in the analytics rollups as a booking event that nothing recomputes,
 * so an off-by-one here silently corrupts every host's occupancy tile forever. The
 * conservation property (nights out === nights in) is the one that matters most.
 *
 * ponytail: plain asserts, no test framework — run it with `bun src/shared/features/booking/utils/nightsByMonth.check.ts`
 */
import { strict as assert } from 'node:assert';

import { nightsByMonth } from './nightsByMonth';
import { nightsBetween } from '../../../utils/dateUtils';

const JUL = Date.UTC(2026, 6, 1);
const AUG = Date.UTC(2026, 7, 1);
const SEP = Date.UTC(2026, 8, 1);

// --- Wholly inside one month → one entry, all the nights.
assert.deepEqual(nightsByMonth('2026-07-10', '2026-07-13'), [{ monthStartMs: JUL, nights: 3 }]);

// --- Straddles a boundary → split, each side gets only its own nights.
// Jul 30, Jul 31 = 2 nights in July; Aug 1, Aug 2 = 2 nights in August.
assert.deepEqual(nightsByMonth('2026-07-30', '2026-08-03'), [
	{ monthStartMs: JUL, nights: 2 },
	{ monthStartMs: AUG, nights: 2 }
]);

// --- Check-out is EXCLUSIVE: a stay ending on the 1st contributes nothing to that month.
assert.deepEqual(nightsByMonth('2026-07-30', '2026-08-01'), [{ monthStartMs: JUL, nights: 2 }]);

// --- Spans a whole month in the middle → three entries, the middle one full.
assert.deepEqual(nightsByMonth('2026-07-31', '2026-09-02'), [
	{ monthStartMs: JUL, nights: 1 },
	{ monthStartMs: AUG, nights: 31 },
	{ monthStartMs: SEP, nights: 1 }
]);

// --- Conservation: the split must always reproduce the unclipped total, or occupancy
// drifts from reality by exactly the nights we lost.
for (const [ci, co] of [
	['2026-01-01', '2026-01-02'],
	['2026-01-28', '2026-03-03'],
	['2026-02-27', '2026-03-01'], // leap-year-adjacent February
	['2026-12-30', '2027-01-04'], // year boundary
	['2026-07-10', '2026-07-13']
]) {
	const total = nightsByMonth(ci, co).reduce((sum, m) => sum + m.nights, 0);
	assert.equal(total, nightsBetween(ci, co), `split lost nights for ${ci}..${co}`);
}

// --- Degenerate input returns nothing rather than throwing: this runs inside a booking
// mutation, and a bad date must not fail the booking itself.
assert.deepEqual(nightsByMonth('2026-07-10', '2026-07-10'), []); // zero nights
assert.deepEqual(nightsByMonth('2026-07-10', '2026-07-09'), []); // inverted
assert.deepEqual(nightsByMonth('not-a-date', '2026-07-13'), []);

console.log('nightsByMonth.check.ts — all assertions passed');
