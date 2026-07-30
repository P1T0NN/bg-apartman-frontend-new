/**
 * Self-check for the range→nights expansion that host calendar blocks are stored from.
 * An off-by-one here blocks a night the host didn't pick, or leaves one bookable.
 *
 * ponytail: plain asserts, no test framework — run it with `bun src/shared/features/booking/utils/nightsInRange.check.ts`
 */
import { strict as assert } from 'node:assert';

import { nightsInRange } from './nightsInRange';

// Half-open: the end date is the checkout day, never a night.
assert.deepEqual(nightsInRange('2026-06-10', '2026-06-13'), [
	'2026-06-10',
	'2026-06-11',
	'2026-06-12'
]);

// A single night.
assert.deepEqual(nightsInRange('2026-06-10', '2026-06-11'), ['2026-06-10']);

// Empty and inverted ranges yield nothing rather than throwing.
assert.deepEqual(nightsInRange('2026-06-10', '2026-06-10'), []);
assert.deepEqual(nightsInRange('2026-06-12', '2026-06-10'), []);
assert.deepEqual(nightsInRange('not-a-date', '2026-06-10'), []);

// Month and year rollover.
assert.deepEqual(nightsInRange('2026-01-31', '2026-02-02'), ['2026-01-31', '2026-02-01']);
assert.deepEqual(nightsInRange('2026-12-31', '2027-01-02'), ['2026-12-31', '2027-01-01']);

// Leap day is a real night.
assert.deepEqual(nightsInRange('2028-02-28', '2028-03-01'), ['2028-02-28', '2028-02-29']);

console.log('nightsInRange: all checks passed');
