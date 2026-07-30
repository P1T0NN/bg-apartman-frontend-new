/**
 * Self-check for the occupancy clipping rule. Every occupancy percentage on the host
 * dashboard is a sum of this function, so an off-by-one here shows up as "112% occupied"
 * or as a month that silently under-reports — both of which look like data problems rather
 * than an arithmetic bug.
 *
 * ponytail: plain asserts, no test framework — run it with `bun src/shared/features/booking/utils/nightsWithinWindow.check.ts`
 */
import { strict as assert } from 'node:assert';

import { nightsWithinWindow } from './nightsWithinWindow';

const JUNE = Date.parse('2026-06-01T00:00:00Z');
const JULY = Date.parse('2026-07-01T00:00:00Z');

const inJune = (checkIn: string, checkOut: string) =>
	nightsWithinWindow(checkIn, checkOut, JUNE, JULY);

// --- Fully inside the window: every night counts.
assert.equal(inJune('2026-06-10', '2026-06-15'), 5);

// --- Check-out day is NOT a night (half-open range, same convention as the siblings).
assert.equal(inJune('2026-06-10', '2026-06-11'), 1);
assert.equal(inJune('2026-06-10', '2026-06-10'), 0);

// --- Straddling the start: only the nights from June 1st onward.
assert.equal(inJune('2026-05-28', '2026-06-03'), 2);

// --- Straddling the end: nights up to (not including) July 1st.
assert.equal(inJune('2026-06-29', '2026-07-04'), 2);

// --- Spanning the whole window: clipped to the window's own length (June = 30 nights).
assert.equal(inJune('2026-05-01', '2026-08-01'), 30);

// --- Entirely outside, either side → 0, never negative.
assert.equal(inJune('2026-04-01', '2026-04-05'), 0);
assert.equal(inJune('2026-08-01', '2026-08-05'), 0);

// --- Touching the boundary is not overlapping: a stay ending exactly at the window start,
//     or starting exactly at its end, contributes nothing.
assert.equal(inJune('2026-05-25', '2026-06-01'), 0);
assert.equal(inJune('2026-07-01', '2026-07-05'), 0);

// --- Unparseable input is 0, not NaN: one bad row must not poison a summed total.
assert.equal(inJune('not-a-date', '2026-06-05'), 0);
assert.equal(inJune('2026-06-01', 'nope'), 0);
assert.ok(!Number.isNaN(inJune('', '')));

// --- A month's worth of stays can never exceed the window's night count.
const stays: [string, string][] = [
	['2026-05-20', '2026-06-04'],
	['2026-06-04', '2026-06-20'],
	['2026-06-20', '2026-07-10']
];
const total = stays.reduce((sum, [ci, co]) => sum + inJune(ci, co), 0);
assert.equal(total, 30);

console.log('nightsWithinWindow: all checks passed');
