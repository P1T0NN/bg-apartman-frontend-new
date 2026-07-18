// LIBRARIES
import { ConvexError, v } from 'convex/values';
import { query } from '@/convex/_generated/server';

// HELPERS
import { getAuthUserId } from '@/convex/auth/helpers/getAuthUserId';
import {
	normalizeOneBasedPage,
	paginatedQueryArgs,
	resolvePaginationOpts
} from '@/convex/helpers/paginationHelpers';

// UTILS
import { bookingToBookingSafe } from '@/convex/tables/bookings/utils/bookingToBookingSafe';

// TYPES
import type { Doc } from '@/convex/_generated/dataModel';
import type { QueryCtx } from '@/convex/_generated/server';
import type { PaginatedListPayload } from '@/shared/components/ui/data-table/types';
import type { ConvexErrorPayload } from '@/shared/types/types';
import type {
	typesBookingFilter,
	typesBookingSafe,
	typesBookingStatus
} from '@/shared/features/booking/types/bookingTypes';

type Scope = 'host' | 'guest';

/** Per-filter counts for the bookings table's segmented control. */
export type BookingFilterCounts = Record<typesBookingFilter, number>;

/** Payload of `listUserBookingsQuery` — one page plus the tab counts, one subscription. */
export type UserBookingsPayload = PaginatedListPayload<typesBookingSafe> & {
	extra: { counts: BookingFilterCounts };
};

/** Statuses folded into the "cancelled" tab — mirrors the client filter taxonomy. */
const CLOSED_STATUSES = new Set<typesBookingStatus>(['cancelled', 'declined', 'auto_declined']);

/** Filter values the table's tabs send ("all" is expressed by omitting the arg). */
const bookingFilterArg = v.union(
	v.literal('pending'),
	v.literal('confirmed'),
	v.literal('checked_in'),
	v.literal('checked_out'),
	v.literal('cancelled')
);

async function requireUserId(ctx: QueryCtx): Promise<string> {
	const userId = await getAuthUserId(ctx);
	if (!userId) {
		throw new ConvexError({
			code: 'NOT_AUTHENTICATED',
			message: { key: 'GenericMessages.NOT_AUTHENTICATED' }
		} satisfies ConvexErrorPayload);
	}
	return userId;
}

/** Index-bounded read of the signed-in user's whole booking scope, newest first. */
async function collectScoped(
	ctx: QueryCtx,
	scope: Scope,
	userId: string
): Promise<Doc<'bookings'>[]> {
	return scope === 'host'
		? ctx.db
				.query('bookings')
				.withIndex('by_host', (q) => q.eq('hostId', userId))
				.order('desc')
				.collect()
		: ctx.db
				.query('bookings')
				.withIndex('by_guest', (q) => q.eq('guestId', userId))
				.order('desc')
				.collect();
}

function matchesFilter(
	b: Doc<'bookings'>,
	filter: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled'
): boolean {
	if (filter === 'cancelled') return CLOSED_STATUSES.has(b.status);
	return b.status === filter;
}

/** Free-text match over the booking doc fields a host/guest is likely to search by. */
function matchesSearch(b: Doc<'bookings'>, needle: string): boolean {
	return [
		`${b.guestFirstName} ${b.guestLastName}`,
		b.bookingCode,
		b.guestEmail,
		b.guestPhone ?? '',
		b.apartmentSlug
	].some((field) => field.toLowerCase().includes(needle));
}

/**
 * Factory for the host/guest bookings-table query: one subscription returns the page AND the
 * per-filter tab counts (`extra.counts`). Counts need the whole scope regardless of the active
 * tab, so the scope is collected once and filter/search/sort/slice run over it in JS.
 *
 * ponytail: O(user's rows) per call, same class as `listBookingsAdmin`. Fine for per-user
 * booking volumes; if a single user's bookings outgrow a few thousand rows, move counts to a
 * counter table and the list back to per-status index reads with cursor pagination.
 */
export function listUserBookingsQuery(scope: Scope) {
	return query({
		args: {
			...paginatedQueryArgs,
			page: v.optional(v.number()),
			filter: v.optional(bookingFilterArg),
			search: v.optional(v.string()),
			sortColumn: v.optional(v.union(v.literal('stay'), v.literal('total'))),
			sortDirection: v.optional(v.union(v.literal('asc'), v.literal('desc')))
		},
		handler: async (ctx, args): Promise<UserBookingsPayload> => {
			const userId = await requireUserId(ctx);
			const rows = await collectScoped(ctx, scope, userId);

			// Tab counts over the whole scope — computed here so the table needs no second query.
			const counts: BookingFilterCounts = {
				all: rows.length,
				pending: 0,
				confirmed: 0,
				checked_in: 0,
				checked_out: 0,
				declined: 0,
				auto_declined: 0,
				cancelled: 0
			};
			for (const b of rows) {
				if (CLOSED_STATUSES.has(b.status)) counts.cancelled += 1;
				else counts[b.status] += 1;
			}

			const needle = args.search?.trim().toLowerCase() ?? '';
			const all = rows.filter(
				(b) =>
					(args.filter === undefined || matchesFilter(b, args.filter)) &&
					(needle === '' || matchesSearch(b, needle))
			);

			const dir = args.sortDirection === 'asc' ? 1 : -1;
			if (args.sortColumn === 'stay') {
				all.sort((a, b) => a.checkInDate.localeCompare(b.checkInDate) * dir);
			} else if (args.sortColumn === 'total') {
				all.sort((a, b) => (a.total - b.total) * dir);
			}
			// Default order: newest first, already guaranteed by the indexed `.order('desc')`.

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
