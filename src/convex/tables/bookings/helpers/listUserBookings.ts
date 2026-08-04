// LIBRARIES
import { v } from 'convex/values';
import { query } from '@/convex/_generated/server';

// HELPERS
import { requireAuthUserId } from '@/convex/auth/helpers/requireAuthUserId';
import { collectScopedBookings } from '@/convex/tables/bookings/helpers/collectScopedBookings';
import {
	normalizeOneBasedPage,
	paginatedQueryArgs,
	resolvePaginationOpts
} from '@/convex/pagination/paginationHelpers';

// UTILS
import { bookingToBookingSafe } from '@/convex/tables/bookings/utils/bookingToBookingSafe';
import { matchesBookingFilter } from '@/shared/features/booking/utils/matchesBookingFilter';
import { matchesBookingSearch } from '@/shared/features/booking/utils/matchesBookingSearch';

// DATA
import { CLOSED_BOOKING_STATUSES } from '@/shared/features/booking/data/bookingsData';

// TYPES
import type {
	typesBookingFilterCounts,
	typesUserBookingsPayload
} from '@/shared/features/booking/types/bookingTypes';

/** Filter values the table's tabs send ("all" is expressed by omitting the arg). */
const bookingFilterArg = v.union(
	v.literal('pending'),
	v.literal('confirmed'),
	v.literal('checked_in'),
	v.literal('checked_out'),
	v.literal('cancelled')
);

/**
 * Factory for the host/guest bookings-table query: one subscription returns the page AND the
 * per-filter tab counts (`extra.counts`). Counts need the whole scope regardless of the active
 * tab, so the scope is collected once and filter/search/sort/slice run over it in JS.
 *
 * ponytail: O(user's rows) per call, same class as `listBookingsAdmin`. Fine for per-user
 * booking volumes; if a single user's bookings outgrow a few thousand rows, move counts to a
 * counter table and the list back to per-status index reads with cursor pagination.
 */
export function listUserBookingsQuery(scope: 'host' | 'guest') {
	return query({
		args: {
			...paginatedQueryArgs,
			page: v.optional(v.number()),
			filter: v.optional(bookingFilterArg),
			search: v.optional(v.string()),
			sortColumn: v.optional(v.union(v.literal('stay'), v.literal('total'))),
			sortDirection: v.optional(v.union(v.literal('asc'), v.literal('desc')))
		},
		handler: async (ctx, args): Promise<typesUserBookingsPayload> => {
			const userId = await requireAuthUserId(ctx);
			const rows = await collectScopedBookings(ctx, scope, userId);

			// Tab counts over the whole scope — computed here so the table needs no second query.
			const counts: typesBookingFilterCounts = {
				all: rows.length,
				pending: 0,
				confirmed: 0,
				checked_in: 0,
				checked_out: 0,
				declined: 0,
				auto_declined: 0,
				withdrawn: 0,
				cancelled: 0
			};
			for (const b of rows) {
				if (CLOSED_BOOKING_STATUSES.has(b.status)) counts.cancelled += 1;
				else counts[b.status] += 1;
			}

			const needle = args.search?.trim().toLowerCase() ?? '';
			const all = rows.filter(
				(b) =>
					(args.filter === undefined || matchesBookingFilter(b, args.filter)) &&
					(needle === '' || matchesBookingSearch(b, needle))
			);

			const dir = args.sortDirection === 'asc' ? 1 : -1;
			if (args.sortColumn === 'stay') {
				all.sort((a, b) => a.checkInDate.localeCompare(b.checkInDate) * dir);
			} else if (args.sortColumn === 'total') {
				all.sort((a, b) => (a.total - b.total) * dir);
			} else if (scope === 'host') {
				// Host default: deadline-ascending, so the request closest to dying is row one
				// (HostSystemDesign.md §3). Rows without a deadline (every status but `pending`)
				// sort last and — `Array.sort` being stable — keep the indexed newest-first order.
				all.sort((a, b) => (a.pendingExpiresAt ?? Infinity) - (b.pendingExpiresAt ?? Infinity));
			}
			// Guest default: newest first, already guaranteed by the indexed `.order('desc')`.

			const { numItems } = resolvePaginationOpts(args.paginationOpts);
			const start = (normalizeOneBasedPage(args.page) - 1) * numItems;
			const slice = all.slice(start, start + numItems);

			return {
				// Enrich the sliced page only — join cost stays O(perPage).
				page: await Promise.all(slice.map((b) => bookingToBookingSafe(ctx, b))),
				isDone: start + slice.length >= all.length,
				continueCursor: '',
				totalCount: all.length,
				extra: { counts }
			};
		}
	});
}
