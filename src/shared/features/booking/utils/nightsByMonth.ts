// UTILS
import { nightsWithinWindow } from './nightsWithinWindow';

/** One calendar month's share of a stay. `monthStartMs` is midnight UTC on the 1st. */
export type MonthNights = { monthStartMs: number; nights: number };

/**
 * Split a stay into the calendar months (UTC) its nights actually fall in.
 *
 * This is what lets occupancy live in the analytics rollups instead of a table scan. The
 * host dashboard asks "how many nights were booked IN JULY" — a per-(stay, window) question
 * that an aggregate's scalar `sumValue` cannot express, because "nights in July" is not a
 * property of the booking row. Emitting one pre-split event per month at confirm time moves
 * the clipping to write time, where it is done once, instead of read time, where it would
 * be redone over every row on every dashboard load.
 *
 * A 3-night stay inside one month yields one entry; a stay straddling July/August yields
 * two, each with only its own side of the boundary. Summing the entries always reproduces
 * `nightsBetween(checkIn, checkOut)` exactly — no night is dropped or double-counted.
 *
 * Returns `[]` for unparseable or zero-night input rather than throwing: callers are
 * tracking analytics inside a booking mutation, and a bad date must not fail the booking.
 */
export function nightsByMonth(checkInDate: string, checkOutDate: string): MonthNights[] {
	const ci = Date.parse(`${checkInDate}T00:00:00Z`);
	const co = Date.parse(`${checkOutDate}T00:00:00Z`);
	if (Number.isNaN(ci) || Number.isNaN(co) || co <= ci) return [];

	const out: MonthNights[] = [];
	const start = new Date(ci);

	// Walk month starts from the check-in month until past the last night. Check-out is
	// exclusive, so a stay ending on the 1st contributes nothing to that final month and
	// the loop condition (strict `<` against `co`) drops it naturally.
	let year = start.getUTCFullYear();
	let month = start.getUTCMonth();

	for (;;) {
		const monthStartMs = Date.UTC(year, month, 1);
		if (monthStartMs >= co) break;

		const nextMonthMs = Date.UTC(year, month + 1, 1);
		const nights = nightsWithinWindow(checkInDate, checkOutDate, monthStartMs, nextMonthMs);
		if (nights > 0) out.push({ monthStartMs, nights });

		year = new Date(nextMonthMs).getUTCFullYear();
		month = new Date(nextMonthMs).getUTCMonth();
	}

	return out;
}
