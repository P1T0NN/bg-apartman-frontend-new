// LIBRARIES
import { query } from '@/convex/_generated/server';

// CONFIG
import { HOST_DASHBOARD } from '@/shared/config';

// HELPERS
import { requireAuthUserId } from '@/convex/auth/helpers/requireAuthUserId';

// UTILS
import { bookingToBookingSafe } from '@/convex/tables/bookings/utils/bookingToBookingSafe';

// TYPES
import type { HostPendingReservations } from '@/convex/pages/host/dashboard/types/hostDashboardTypes';

/**
 * The host dashboard's band-1 "needs your response" strip.
 *
 * **The one live leg of this page.** Realtime verdict: SUBSCRIPTION, and it is the rule's
 * admin-orders example verbatim — requests arrive from guests and the lifecycle cron
 * expires them into `auto_declined` while the host is looking at the screen, without the
 * host acting (GeneralSystemDesignRule.md). A stale strip here means a host answers a
 * request that already died, or misses one that is about to.
 *
 * Deliberately small so re-running it is cheap: one `by_host_status_checkin` slice bounded
 * by `QUEUE_COUNT_CAP`, and apartment joins paid only for the handful of rows displayed.
 * The expensive dashboard legs (stats, charts) are separate one-shot queries precisely so
 * they do NOT re-run every time this one is invalidated.
 */
export const fetchHostDashboardPendingBookings = query({
	args: {},
	handler: async (ctx): Promise<HostPendingReservations> => {
		const hostId = await requireAuthUserId(ctx);

		// Bounded read: `.take(CAP + 1)` is what lets the UI say "50+" without ever
		// collecting the host's whole pending history to count it.
		const pending = await ctx.db
			.query('bookings')
			.withIndex('by_host_status_checkin', (q) => q.eq('hostId', hostId).eq('status', 'pending'))
			.take(HOST_DASHBOARD.QUEUE_COUNT_CAP + 1);

		// `awaiting` rows are open checkouts — invisible until their authorization webhook
		// lands, so never a host queue entry (PaymentsSystemDesign.md §3).
		const visible = pending.filter((b) => b.paymentStatus !== 'awaiting');

		const items = await Promise.all(
			visible
				// Deadline-ascending: the request closest to dying is row one
				// (HostSystemDesign.md §3). The index orders by check-in date, not expiry.
				.sort((a, b) => (a.pendingExpiresAt ?? Infinity) - (b.pendingExpiresAt ?? Infinity))
				.slice(0, HOST_DASHBOARD.QUEUE_DISPLAY_LIMIT)
				.map((booking) => bookingToBookingSafe(ctx, booking))
		);

		const total = Math.min(visible.length, HOST_DASHBOARD.QUEUE_COUNT_CAP);
		const capped = visible.length > HOST_DASHBOARD.QUEUE_COUNT_CAP;

		return {
			items,
			total,
			capped
		};
	}
});
