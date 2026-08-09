// LIBRARIES
import { v } from 'convex/values';
import { mergedStream, stream } from 'convex-helpers/server/stream';

// SCHEMA — convex-helpers streams reflect index field order from it.
import schema from '@/convex/schema';

// UTILS
import { hasAvailabilityConflict } from '@/convex/tables/bookings/helpers/hasAvailabilityConflict';
import { matchesSearchFilters } from '@/shared/features/accommodation/utils/matchesSearchFilters';

// TYPES
import type { QueryStream } from 'convex-helpers/server/stream';
import type { QueryCtx } from '@/convex/_generated/server';
import type { Doc } from '@/convex/_generated/dataModel';

/**
 * The `/search` query arguments, shared by every endpoint that answers a search — so the list
 * and the map can never be filtering by different rules.
 */
export const searchAccommodationsArgs = {
	placeId: v.optional(v.string()),
	checkIn: v.optional(v.string()),
	checkOut: v.optional(v.string()),
	bedrooms: v.optional(v.number()),
	bathrooms: v.optional(v.number()),
	guests: v.optional(v.number())
} as const;

export type SearchAccommodationsArgs = {
	placeId?: string;
	checkIn?: string;
	checkOut?: string;
	bedrooms?: number;
	bathrooms?: number;
	guests?: number;
};

/**
 * ONE lazily-evaluated, cursor-paginable stream of the apartments a search matches.
 *
 * This is the whole reason `/search` scales: it is a **stream**, not a collected array. Callers
 * `.paginate({ numItems, cursor, maximumRowsRead, maximumBytesRead })` it, and convex-helpers
 * pulls only as many rows as that page needs — filters included. Nothing is ever truncated: when
 * a page stops early (filled, or a read guard tripped) it hands back an exact continuation
 * cursor and `isDone: false`, so the next request resumes at the row after the last one read.
 * A region with 100,000 listings therefore costs the same per request as one with 12; it just
 * takes more requests to walk, and every listing is reachable. There is no cap.
 *
 * **The region match is indexed, and that is a correctness property, not an optimization.** The
 * picked region is a Google place id, so it is language-independent — "Beograd" and "Belgrade"
 * resolve to the same id. A listing stores its city and country ids in their own columns
 * (`splitRegionPlaceId`, written by the create/update mutations), so a region search is an exact
 * index range: it reads that region's published listings and nothing else. Two streams because
 * the search box offers cities AND countries and the caller doesn't say which kind it picked, so
 * we ask both and merge.
 *
 * **Count minimums and availability stay in TypeScript on purpose.** Convex allows one range
 * field per index, so `bedrooms >= a AND bathrooms >= b AND guests >= c` cannot be an index
 * range at any field ordering, and availability is a join against two other tables. `filterWith`
 * is the supported way to express that without giving up cursor pagination: rejected rows count
 * as read (that is what the read guards bound), but they never inflate the payload and never
 * break the cursor.
 *
 * Ordering is `_creationTime` descending — newest first, and the total order the merge needs.
 */
export function searchAccommodationsStream(
	ctx: QueryCtx,
	args: SearchAccommodationsArgs
): QueryStream<Doc<'apartments'>> {
	const { placeId } = args;
	const db = stream(ctx.db, schema);
	const dated = Boolean(args.checkIn && args.checkOut && args.checkIn < args.checkOut);

	/**
	 * The filters no index can express, in cost order: the caller's minimums (free, in memory)
	 * before the availability join (two index slices). A row rejected by a minimum must never
	 * pay for the join.
	 */
	const matches = async (a: Doc<'apartments'>): Promise<boolean> => {
		if (!matchesSearchFilters(a, args)) return false;

		if (!dated) return true;

		// Both reads are bounded to a fixed-width date window — see `hasAvailabilityConflict`.
		// Bounded per PAGE now; it used to fan out over the whole result set, on every keystroke.
		return !(await hasAvailabilityConflict(ctx, a._id, args.checkIn!, args.checkOut!));
	};

	if (placeId === undefined) {
		// No region picked — "show me anything". One index range over published listings,
		// paginated like everything else, so this path has no ceiling either.
		return db
			.query('apartments')
			.withIndex('by_status', (q) => q.eq('status', 'published'))
			.order('desc')
			.filterWith(matches);
	}

	const byCity = db
		.query('apartments')
		.withIndex('by_status_city', (q) => q.eq('status', 'published').eq('cityPlaceId', placeId))
		.order('desc')
		.filterWith(matches);

	// A listing whose city and country ids are equal (`splitRegionPlaceId`'s unsplit fallback) is
	// in BOTH ranges, so the country stream drops what the city stream already emitted. A
	// stateless test on the row itself — a "have I seen this?" set would be wrong the moment a
	// page boundary fell between the duplicates. Checked before `matches` so a duplicate costs
	// nothing beyond being read.
	const byCountry = db
		.query('apartments')
		.withIndex('by_status_country', (q) =>
			q.eq('status', 'published').eq('countryPlaceId', placeId)
		)
		.order('desc')
		.filterWith(async (a) => a.cityPlaceId !== placeId && (await matches(a)));

	// Filters live on the SUB-streams, not the merge: each stream still `eq`s every field of its
	// index, so each remains ordered by `_creationTime` afterwards — the requirement for merging
	// on that field, and the exact arrangement `fetchOptimized`'s union mode already runs.
	return mergedStream([byCity, byCountry], ['_creationTime']);
}
