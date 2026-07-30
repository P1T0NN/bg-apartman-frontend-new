// TYPES
import type { Doc } from '@/convex/_generated/dataModel';
import type { QueryCtx } from '@/convex/_generated/server';

/**
 * Index-bounded read of one user's whole booking scope, newest first.
 *
 * `host` reads `by_host`, `guest` reads `by_guest` — never a table scan. The full scope is
 * needed because the tab counts are computed over it (see `listUserBookings`).
 *
 * `awaiting` rows are dropped here, the one choke point both booking tables share: an open
 * checkout is invisible until its authorization webhook lands — no host queue entry, no
 * guest list entry, and no contribution to either side's tab counts
 * (PaymentsSystemDesign.md §3). Abandoned ones are reaped by the lifecycle cron.
 */
export async function collectScopedBookings(
	ctx: QueryCtx,
	scope: 'host' | 'guest',
	userId: string
): Promise<Doc<'bookings'>[]> {
	const rows =
		scope === 'host'
			? await ctx.db
					.query('bookings')
					.withIndex('by_host', (q) => q.eq('hostId', userId))
					.order('desc')
					.collect()
			: await ctx.db
					.query('bookings')
					.withIndex('by_guest', (q) => q.eq('guestId', userId))
					.order('desc')
					.collect();

	return rows.filter((booking) => booking.paymentStatus !== 'awaiting');
}
