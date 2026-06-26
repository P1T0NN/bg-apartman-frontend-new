// HELPERS
import { getAuthUserId } from '@/convex/auth/helpers/getAuthUserId';

// TYPES
import type { Doc } from '@/convex/_generated/dataModel';
import type { QueryCtx } from '@/convex/_generated/server';

/**
 * The signed-in guest's upcoming trips — confirmed and still ahead of today, soonest first.
 *
 * The `by_guest_status_checkin` index filters (guest + confirmed + checkInDate ≥ today) and
 * orders by check-in on the server, so this reads ONLY confirmed, future rows — never the
 * whole booking history. Pass `limit` to stop the server after N rows (e.g. `1` for just the
 * next trip); omit it to get the full upcoming set (still scoped, so naturally small).
 * Returns `[]` when anonymous or nothing is booked.
 */
export async function getUpcomingBookingForCurrentUser(
	ctx: QueryCtx,
	limit?: number
): Promise<Doc<'bookings'>[]> {
	const userId = await getAuthUserId(ctx);
	if (!userId) return [];

	const today = new Date().toISOString().slice(0, 10); // ISO dates sort lexicographically

	const upcoming = ctx.db
		.query('bookings')
		.withIndex('by_guest_status_checkin', (q) =>
			q.eq('guestId', userId).eq('status', 'confirmed').gte('checkInDate', today)
		);

	return limit === undefined ? upcoming.collect() : upcoming.take(limit);
}
