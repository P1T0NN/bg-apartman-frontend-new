// LIBRARIES
import { v } from 'convex/values';
import { query } from '@/convex/_generated/server';

// CONFIG
import { OPERATIONAL_LIMITS } from '@/shared/config';

// UTILS
import { authComponent } from '@/convex/auth/auth';
import { requireAdmin } from '@/convex/auth/middleware/authMiddleware';
import {
	paginatedQueryArgs,
	normalizeOneBasedPage,
	resolvePaginationOpts
} from '@/convex/pagination/paginationHelpers';
import { bookingToBookingSafe } from '@/convex/tables/bookings/utils/bookingToBookingSafe';

// SCHEMAS
import { bookingStatus, paymentStatus } from '../schemas/bookingsSchemas';

// TYPES
import type { PaginatedListPayload } from '@/shared/features/pagination/types/paginationTypes';
import type { typesBookingSafe } from '@/shared/features/booking/types/bookingTypes';

/**
 * Booking row enriched for the admin support table: safe shape + host label + the
 * listing's public slug (the safe shape drops it, but the admin table links each booking
 * to the accommodation page — AdminPagesSystemDesign.md §3).
 */
export type AdminBookingRow = typesBookingSafe & { hostName: string; apartmentSlug: string };

/**
 * Admin bookings support table. Search routes through the exact-match indexes
 * (`by_booking_code`, `by_guest_email`) so "guest emails about BK7X9M2P4Q" is a
 * single indexed read; a status filter uses `by_status`; the guest-detail tab
 * uses `by_guest`. Payment status and the check-in date range are post-scan JS
 * filters — unindexed, acceptable for an admin tool.
 *
 * ponytail: the no-filter view scans the table in offset strategy, capped at
 * `ADMIN_LIST_SCAN_LIMIT` — past that the view truncates and the server logs it, rather
 * than growing until it trips Convex's per-query ceiling and takes the page down. Move to
 * cursor pagination when that cap starts being hit; the cost is the exact `totalCount` and
 * the numbered pager, so it's a UI decision, not a drop-in.
 */
export const listBookingsAdmin = query({
	args: {
		...paginatedQueryArgs,
		page: v.optional(v.number()),
		search: v.optional(v.string()),
		searchField: v.optional(v.union(v.literal('code'), v.literal('email'))),
		status: v.optional(bookingStatus),
		paymentStatus: v.optional(paymentStatus),
		/** ISO `YYYY-MM-DD` bounds on `checkInDate`, inclusive. */
		checkInFrom: v.optional(v.string()),
		checkInTo: v.optional(v.string()),
		guestId: v.optional(v.string()),
		/**
		 * `true` = only rows carrying a `paymentFlag` — the money operations that failed and
		 * need a human to finish them (PaymentsSystemDesign.md §4/§6). This is the surface the
		 * whole "failures flag, they don't loop" pattern points at, and the one the daily
		 * reconciliation cron keeps re-populating.
		 */
		flagged: v.optional(v.boolean())
	},
	handler: async (ctx, args): Promise<PaginatedListPayload<AdminBookingRow>> => {
		await requireAdmin(ctx);

		const search = args.search?.trim();
		const searchField = args.searchField ?? 'code';

		let rows;
		if (search && searchField === 'code') {
			rows = await ctx.db
				.query('bookings')
				.withIndex('by_booking_code', (q) => q.eq('bookingCode', search.toUpperCase()))
				.order('desc')
				.collect();
		} else if (search) {
			// Emails are stored as typed (trimmed only), so exact-match both the raw and
			// lowercased forms and merge — two bounded index reads, no scan.
			const variants = [...new Set([search, search.toLowerCase()])];
			rows = (
				await Promise.all(
					variants.map((email) =>
						ctx.db
							.query('bookings')
							.withIndex('by_guest_email', (q) => q.eq('guestEmail', email))
							.order('desc')
							.collect()
					)
				)
			).flat();
		} else if (args.guestId !== undefined) {
			const guestId = args.guestId;
			rows = await ctx.db
				.query('bookings')
				.withIndex('by_guest', (q) => q.eq('guestId', guestId))
				.order('desc')
				.collect();
		} else if (args.status !== undefined) {
			const status = args.status;
			// Capped: terminal buckets like `checked_out` accumulate forever.
			rows = await ctx.db
				.query('bookings')
				.withIndex('by_status', (q) => q.eq('status', status))
				.order('desc')
				.take(OPERATIONAL_LIMITS.ADMIN_LIST_SCAN_LIMIT);
		} else {
			// The page's DEFAULT state, and the only unindexed read here. Capped because an
			// uncapped `.collect()` of the whole bookings table does not degrade — it works
			// until it trips Convex's per-query document ceiling and then the admin bookings
			// page fails outright, with no warning beforehand.
			rows = await ctx.db
				.query('bookings')
				.order('desc')
				.take(OPERATIONAL_LIMITS.ADMIN_LIST_SCAN_LIMIT);
		}

		if (rows.length >= OPERATIONAL_LIMITS.ADMIN_LIST_SCAN_LIMIT) {
			console.warn(
				'[listBookingsAdmin] scan cap reached — the table is truncated and totalCount is a floor',
				{
					cap: OPERATIONAL_LIMITS.ADMIN_LIST_SCAN_LIMIT,
					status: args.status,
					search: Boolean(search)
				}
			);
		}

		const all = rows.filter((b) => {
			if (args.status !== undefined && b.status !== args.status) return false;
			if (args.paymentStatus !== undefined && b.paymentStatus !== args.paymentStatus) return false;
			if (args.checkInFrom !== undefined && b.checkInDate < args.checkInFrom) return false;
			if (args.checkInTo !== undefined && b.checkInDate > args.checkInTo) return false;
			if (args.flagged === true && b.paymentFlag === undefined) return false;
			return true;
		});

		const { numItems } = resolvePaginationOpts(args.paginationOpts);
		const start = (normalizeOneBasedPage(args.page) - 1) * numItems;
		const slice = all.slice(start, start + numItems);

		// Dedupe host ids and batch the BA lookups — page-bounded, no N+1.
		const hostIds = [...new Set(slice.map((b) => b.hostId))];
		const hosts = new Map(
			await Promise.all(
				hostIds.map(async (id) => [id, await authComponent.getAnyUserById(ctx, id)] as const)
			)
		);

		const page = await Promise.all(
			slice.map(async (b) => ({
				...(await bookingToBookingSafe(ctx, b)),
				hostName: hosts.get(b.hostId)?.name?.trim() || (hosts.get(b.hostId)?.email ?? '—'),
				apartmentSlug: b.apartmentSlug
			}))
		);

		return {
			page,
			isDone: start + slice.length >= all.length,
			continueCursor: '',
			totalCount: all.length
		};
	}
});
