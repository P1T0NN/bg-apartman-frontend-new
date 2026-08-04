// LIBRARIES
import { v } from 'convex/values';
import { internalMutation } from '@/convex/functions';

// CONFIG
import { OPERATIONAL_LIMITS } from '@/shared/config';

// UTILS
import { internal } from '@/convex/_generated/api';
import { splitRegionPlaceId } from '@/shared/features/accommodation/utils/splitRegionPlaceId';

/**
 * One-time backfill: derive `cityPlaceId` / `countryPlaceId` from each listing's existing
 * merged `placeId`.
 *
 * **Run this before the search change reaches users.** Search now matches on the split
 * columns via an index, so a row that still has only the merged `placeId` matches nothing —
 * it would silently vanish from every region search. Both write paths populate the columns
 * from now on; this covers the rows written before them.
 *
 * ```bash
 * bunx convex run tables/accommodations/crons/backfillRegionPlaceIds:backfillRegionPlaceIds
 * ```
 *
 * Idempotent + paginated (self-scheduling): re-running is free, and rows already carrying the
 * correct halves are skipped rather than rewritten. Touches every status, not just published —
 * a suspended listing that gets republished must be searchable immediately, without a second
 * backfill.
 *
 * Deliberately does NOT stamp `updatedAt`: this fills in a derived column, it is not a content
 * edit, and `updatedAt` is what `/sitemap.xml` publishes as `<lastmod>`. Bumping it would tell
 * every crawler that the whole catalogue changed on migration day.
 */
export const backfillRegionPlaceIds = internalMutation({
	args: {
		cursor: v.optional(v.union(v.string(), v.null()))
	},
	returns: v.object({
		stamped: v.number(),
		skippedNoPlaceId: v.number(),
		isDone: v.boolean()
	}),
	handler: async (ctx, args) => {
		const page = await ctx.db.query('apartments').paginate({
			cursor: args.cursor ?? null,
			numItems: OPERATIONAL_LIMITS.LISTING_FEE_SWEEP_MAX_PER_RUN
		});

		let stamped = 0;
		let skippedNoPlaceId = 0;

		for (const apartment of page.page) {
			const { cityPlaceId, countryPlaceId } = splitRegionPlaceId(apartment.placeId);

			// No merged id to split — nothing can be derived. Left alone and counted, because a
			// published row in this state is unsearchable by region and a human needs to know.
			if (cityPlaceId === undefined && countryPlaceId === undefined) {
				skippedNoPlaceId++;
				continue;
			}

			if (apartment.cityPlaceId === cityPlaceId && apartment.countryPlaceId === countryPlaceId) {
				continue;
			}

			await ctx.db.patch(apartment._id, { cityPlaceId, countryPlaceId });
			stamped++;
		}

		if (!page.isDone) {
			await ctx.scheduler.runAfter(
				0,
				internal.tables.accommodations.crons.backfillRegionPlaceIds.backfillRegionPlaceIds,
				{ cursor: page.continueCursor }
			);
		}

		if (skippedNoPlaceId > 0) {
			console.warn(
				'[backfillRegionPlaceIds] listings with no placeId — these are unsearchable by region',
				{ skippedNoPlaceId }
			);
		}

		return { stamped, skippedNoPlaceId, isDone: page.isDone };
	}
});
