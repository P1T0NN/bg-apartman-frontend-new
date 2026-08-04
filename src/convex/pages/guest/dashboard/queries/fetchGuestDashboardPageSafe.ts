// LIBRARIES
import { query } from '@/convex/_generated/server';

// CONFIG
import { GUEST_DASHBOARD } from '@/shared/config';

// HELPERS
import { getAuthUserId } from '@/convex/auth/helpers/getAuthUserId';
import { getUpcomingBookingForCurrentUser } from '@/convex/tables/bookings/helpers/getUpcomingBookingForCurrentUser';

// UTILS
import { bookingToGuestTripSummary } from '@/convex/pages/guest/dashboard/utils/bookingToGuestTripSummary';

// TYPES
import type { GuestDashboardData } from '@/convex/pages/guest/dashboard/types/guestDashboardTypes';

/**
 * Composed payload for the guest dashboard (`/guest/dashboard`): next trip, a few more
 * upcoming, and the counts behind the shortcut tiles — one subscription, one snapshot.
 * Returns `null` when unauthenticated so the page can decide what to render.
 *
 * The greeting name (from the auth user) and the saved-places count (localStorage) are read
 * client-side, so they're deliberately not part of this payload.
 */
export const fetchGuestDashboardPageSafe = query({
	args: {},
	handler: async (ctx): Promise<GuestDashboardData | null> => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return null;

		// Each read is scoped to one status slice via `by_guest_status_checkin` — not the whole
		// booking history. `upcoming` is sliced for the hero + "more" and its length reused as
		// the count, so it's read once. Capped like its `checkedOut` twin below: "future trips
		// only" is small for a normal guest but has no ceiling of its own, and this is a live
		// subscription — a guest holding a year of weekend bookings would re-read all of them
		// on every write, to render four.
		const upcoming = await getUpcomingBookingForCurrentUser(
			ctx,
			GUEST_DASHBOARD.UPCOMING_COUNT_CAP + 1
		);

		const checkedOut = await ctx.db
			.query('bookings')
			.withIndex('by_guest_status_checkin', (q) =>
				q.eq('guestId', userId).eq('status', 'checked_out')
			)
			.take(GUEST_DASHBOARD.CHECKED_OUT_COUNT_CAP + 1); // bounded read — the tile shows "99+" past the cap

		// Only pay for apartment joins on the handful of trips we actually show.
		const shown = await Promise.all(
			upcoming
				.slice(0, GUEST_DASHBOARD.UPCOMING_LIMIT)
				.map((booking) => bookingToGuestTripSummary(ctx, booking))
		);

		return {
			nextTrip: shown[0] ?? null,
			moreUpcoming: shown.slice(1),
			counts: {
				upcoming: upcoming.length,
				checkedOut: checkedOut.length
			}
		};
	}
});
