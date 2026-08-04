/**
 * The invariant every availability read depends on.
 *
 * Those reads bound their scan to stays STARTING within `MAX_STAY_NIGHTS` before the
 * requested window (`hasAvailabilityConflict`, `findOverlappingPendingBookings`, the
 * calendar and book-page reads). That is only sound if two things hold together:
 *
 *   1. `createBookingSchema` actually rejects longer stays, and
 *   2. `shiftIsoDate` walks back far enough that any stay which could still be occupying a
 *      night in the window is inside the range.
 *
 * Break either and the failure is silent and expensive: an overlapping stay stops being
 * seen, and the nights it occupies become double-bookable. Hence a check.
 *
 * ponytail: plain asserts, no test framework — run it with
 * `bun src/shared/features/booking/utils/availabilityBounds.check.ts`
 */
import { strict as assert } from 'node:assert';

import { PROJECT_SETTINGS } from '../../../config';
import { nightsBetween, shiftIsoDate } from '../../../utils/dateUtils';
import { nightRangesOverlap } from './nightRangesOverlap';
import { createBookingSchema } from '../schemas/bookingsSchemas';

const MAX = PROJECT_SETTINGS.MAX_STAY_NIGHTS;

// --- shiftIsoDate walks the calendar correctly, including across month/year/leap boundaries.
assert.equal(shiftIsoDate('2026-03-10', -1), '2026-03-09');
assert.equal(shiftIsoDate('2026-03-01', -1), '2026-02-28');
assert.equal(shiftIsoDate('2028-03-01', -1), '2028-02-29'); // leap year
assert.equal(shiftIsoDate('2026-01-01', -1), '2025-12-31');
assert.equal(shiftIsoDate('2026-01-01', 1), '2026-01-02');
assert.equal(shiftIsoDate('2026-06-15', 0), '2026-06-15');
assert.equal(nightsBetween(shiftIsoDate('2026-06-15', -MAX), '2026-06-15'), MAX);
// Degenerate input is returned unchanged rather than throwing — these run inside queries.
assert.equal(shiftIsoDate('not-a-date', -5), 'not-a-date');

// --- THE bound: any stay that overlaps [winStart, winEnd) and is at most MAX nights long
//     must start on or after `winStart - MAX`, i.e. must fall inside what we actually read.
const winStart = '2026-06-10';
const winEnd = '2026-06-15';
const readFloor = shiftIsoDate(winStart, -MAX);

for (let startsDaysBefore = 0; startsDaysBefore <= MAX + 5; startsDaysBefore++) {
	const checkIn = shiftIsoDate(winStart, -startsDaysBefore);

	for (const nights of [1, 2, 7, 30, MAX]) {
		const checkOut = shiftIsoDate(checkIn, nights);
		if (!nightRangesOverlap(winStart, winEnd, checkIn, checkOut)) continue;

		// An overlapping stay of legal length is always inside the read range.
		assert.ok(
			checkIn >= readFloor,
			`overlapping stay ${checkIn}..${checkOut} (${nights}n) starts before the read floor ${readFloor} — it would be MISSED and its nights double-booked`
		);
		assert.ok(checkIn < winEnd, `stay ${checkIn} should be below the range's upper bound`);
	}
}

// --- The schema must actually enforce the ceiling the bound assumes.
const booking = (checkInDate: string, checkOutDate: string) => ({
	apartmentSlug: 'a',
	hostId: 'h',
	guestFirstName: 'A',
	guestLastName: 'B',
	guestEmail: 'a@b.com',
	guestPhone: '0601234567',
	checkInDate,
	checkOutDate,
	numberOfAdults: 1,
	numberOfChildren: 0,
	paymentMethod: 'cash' as const,
	instantBooking: false
});

assert.ok(createBookingSchema.safeParse(booking('2026-06-01', '2026-06-02')).success, '1 night');
assert.ok(
	createBookingSchema.safeParse(booking('2026-06-01', shiftIsoDate('2026-06-01', MAX))).success,
	`exactly MAX (${MAX}) nights must be allowed`
);
assert.ok(
	!createBookingSchema.safeParse(booking('2026-06-01', shiftIsoDate('2026-06-01', MAX + 1)))
		.success,
	`MAX + 1 nights MUST be rejected — the availability reads cannot see a stay that long`
);
assert.ok(
	!createBookingSchema.safeParse(booking('2026-06-01', '2026-06-01')).success,
	'zero nights must be rejected'
);

console.log('availabilityBounds.check.ts — all assertions passed');
