// LIBRARIES
import { v } from 'convex/values';
import { internalMutation } from '@/convex/functions';

// CONFIG
import { PROJECT_SETTINGS, OPERATIONAL_LIMITS } from '@/shared/config';

// UTILS
import { internal } from '@/convex/_generated/api';
import { recordNights } from '@/convex/analytics';

/**
 * One-time backfill of the occupancy ledger for bookings that predate it.
 *
 * Occupancy moved from a read-time table scan to write-time events
 * (`booking.nights_booked` / `booking.nights_released`, split per calendar month). Bookings
 * confirmed BEFORE that switch never emitted them, so without this every host's occupancy
 * tile reads 0 for their entire history.
 *
 * Emits `'booked'` for every booking currently in an earning status. Cancelled bookings are
 * skipped entirely rather than emitting a booked/released pair that nets to zero — the pair
 * would be busywork, and the ledger only has to be right in aggregate.
 *
 * Idempotent: `recordNights` keys each (booking, month) by id (`insertIfDoesNotExist`), so
 * re-running double-counts nothing and a booking the live path already recorded is skipped.
 * Paginated and self-scheduling, like `functions:backfillCounters`.
 *
 * ```bash
 * bunx convex run analytics/backfillOccupancyNights:backfillOccupancyNights
 * ```
 */
export const backfillOccupancyNights = internalMutation({
	args: { cursor: v.optional(v.union(v.string(), v.null())) },
	returns: v.null(),
	handler: async (ctx, args) => {
		const page = await ctx.db.query('bookings').paginate({
			cursor: args.cursor ?? null,
			numItems: OPERATIONAL_LIMITS.AGGREGATE_BACKFILL_BATCH
		});

		for (const booking of page.page) {
			const earning = PROJECT_SETTINGS.BOOKING_EARNING_STATUSES.some(
				(status) => status === booking.status
			);
			if (earning) await recordNights(ctx, booking, 'booked');
		}

		if (!page.isDone) {
			await ctx.scheduler.runAfter(
				0,
				internal.analytics.backfillOccupancyNights.backfillOccupancyNights,
				{ cursor: page.continueCursor }
			);
		}

		return null;
	}
});
