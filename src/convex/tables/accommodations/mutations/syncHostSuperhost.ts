// LIBRARIES
import { v } from 'convex/values';
import { internalMutation } from '@/convex/functions';

// CONFIG
import { OPERATIONAL_LIMITS } from '@/shared/config';

// UTILS
import { internal } from '@/convex/_generated/api';

/**
 * Push a host's superhost flag onto every listing they own.
 *
 * `apartments.isSuperhost` is a DENORMALIZED copy of the better-auth user field: search and
 * list reads must show the badge without a per-row user lookup, so the flag is stamped at
 * create time. That copy is what makes `setUserSuperhost` a two-step operation — flipping the
 * user row alone would leave every existing listing showing the old badge until it was next
 * edited.
 *
 * Scheduled (never awaited) from `setUserSuperhost`, because a sizeable minority of hosts own
 * 100+ listings and the admin's click must not wait on the fan-out. Paginated and
 * self-scheduling, like `functions:backfillCounters`.
 *
 * Idempotent: rows already carrying the target value are skipped, so a re-run — or two
 * toggles racing — settles on the value of whichever run finishes last, which is also the
 * value now on the user row.
 */
export const syncHostSuperhost = internalMutation({
	args: {
		hostId: v.string(),
		isSuperhost: v.boolean(),
		cursor: v.optional(v.union(v.string(), v.null()))
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const page = await ctx.db
			.query('apartments')
			.withIndex('by_host', (q) => q.eq('hostId', args.hostId))
			.paginate({
				cursor: args.cursor ?? null,
				numItems: OPERATIONAL_LIMITS.AGGREGATE_BACKFILL_BATCH
			});

		for (const apartment of page.page) {
			if ((apartment.isSuperhost ?? false) === args.isSuperhost) continue;
			await ctx.db.patch(apartment._id, { isSuperhost: args.isSuperhost });
		}

		if (!page.isDone) {
			await ctx.scheduler.runAfter(
				0,
				internal.tables.accommodations.mutations.syncHostSuperhost.syncHostSuperhost,
				{ hostId: args.hostId, isSuperhost: args.isSuperhost, cursor: page.continueCursor }
			);
		}

		return null;
	}
});
