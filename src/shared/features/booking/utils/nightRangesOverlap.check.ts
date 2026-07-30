/**
 * Self-check for the night-convention every availability decision goes through — bookings,
 * host calendar blocks, and search filtering all call `nightRangesOverlap`. An off-by-one
 * here is a double-booking or a wrongly-rejected stay, so it gets a runnable check.
 *
 * ponytail: plain asserts, no test framework — run it with `bun src/shared/features/booking/utils/nightRangesOverlap.check.ts`
 */
import { strict as assert } from 'node:assert';

import { nightRangesOverlap } from './nightRangesOverlap';

const overlaps = (a: [string, string], b: [string, string]) =>
	nightRangesOverlap(a[0], a[1], b[0], b[1]);

// Shares nights → conflict.
assert.equal(overlaps(['2026-06-10', '2026-06-15'], ['2026-06-14', '2026-06-20']), true);

// Same-day turnover is legal: A leaves the 15th, B arrives the 15th.
assert.equal(overlaps(['2026-06-10', '2026-06-15'], ['2026-06-15', '2026-06-20']), false);
assert.equal(overlaps(['2026-06-15', '2026-06-20'], ['2026-06-10', '2026-06-15']), false);

// Symmetric.
assert.equal(overlaps(['2026-06-10', '2026-06-20'], ['2026-06-12', '2026-06-14']), true);
assert.equal(overlaps(['2026-06-12', '2026-06-14'], ['2026-06-10', '2026-06-20']), true);

// Fully separate ranges.
assert.equal(overlaps(['2026-06-01', '2026-06-05'], ['2026-06-20', '2026-06-25']), false);

// Lexicographic comparison holds across month and year boundaries.
assert.equal(overlaps(['2026-12-28', '2027-01-03'], ['2027-01-02', '2027-01-05']), true);
assert.equal(overlaps(['2026-01-28', '2026-02-02'], ['2026-02-02', '2026-02-05']), false);

console.log('nightRangesOverlap: all checks passed');
