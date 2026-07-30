// UTILS
import { analytics, ANALYTICS_EVENT, hostAnalyticsScope } from '@/convex/analytics';
import { nightsByMonth } from '@/shared/features/booking/utils/nightsByMonth';

// TYPES
import type { MutationCtx } from '@/convex/_generated/server';
import type { Doc, Id } from '@/convex/_generated/dataModel';

/** The fields the split needs — narrower than `Doc<'bookings'>` so callers can pass a literal. */
type NightsSource = Pick<Doc<'bookings'>, 'hostId' | 'checkInDate' | 'checkOutDate'> & {
	_id: Id<'bookings'>;
};

/**
 * Emit the occupancy ledger for one booking: one event per calendar month the stay touches,
 * dated into that month so it lands in the right rollup bucket.
 *
 * Pair `'booked'` with the `booking.confirmed` track and `'released'` with
 * `booking.cancelled` — the two must stay balanced, since the dashboard reads occupancy as
 * `nightsBooked − nightsReleased`. Emit `'released'` ONLY when a booking leaves an EARNING
 * status: a withdrawn or auto-declined `pending` request never had its nights counted, so
 * releasing them would drive occupancy negative.
 *
 * Every event carries a `unique` key of `(direction, bookingId, month)` scoped `forever`, so
 * emitting twice for the same booking-month is a no-op. That is what makes
 * `backfillOccupancyNights` safe to re-run, and what stops the backfill from double-counting
 * a booking the live path already recorded.
 *
 * ⚠️ This is a ledger, not a recomputation. Unlike the table scan it replaced it does not
 * self-heal: if a confirmed booking's DATES are ever edited, the mutation doing the editing
 * must emit a `'released'` for the old span and a `'booked'` for the new one, or occupancy
 * drifts permanently. Same obligation `gmv` / `gmvCancelled` already carry
 * (`GeneralSystemDesignRule.md` § table counts). No mutation edits confirmed dates today.
 */
export async function trackBookingNights(
	ctx: MutationCtx,
	booking: NightsSource,
	direction: 'booked' | 'released'
): Promise<void> {
	const months = nightsByMonth(booking.checkInDate, booking.checkOutDate);
	if (months.length === 0) return;

	const name =
		direction === 'booked'
			? ANALYTICS_EVENT.BOOKING_NIGHTS_BOOKED
			: ANALYTICS_EVENT.BOOKING_NIGHTS_RELEASED;

	const scopes = [hostAnalyticsScope(booking.hostId)];

	for (const { monthStartMs, nights } of months) {
		await analytics.track(ctx, name, {
			// Dated INTO the month the nights belong to, not the moment of booking — a stay
			// booked in May for July occupies July. This is the whole trick.
			occurredAt: monthStartMs,
			scopes,
			properties: { nights },
			unique: { key: `nights:${direction}:${booking._id}:${monthStartMs}`, scope: 'forever' }
		});
	}
}
