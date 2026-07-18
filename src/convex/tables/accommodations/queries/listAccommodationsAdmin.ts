// LIBRARIES
import { v } from 'convex/values';
import { query } from '@/convex/_generated/server';

// UTILS
import { authComponent } from '@/convex/auth/auth';
import { requireAdmin } from '@/convex/auth/middleware/authMiddleware';
import {
	paginatedQueryArgs,
	normalizeOneBasedPage,
	resolvePaginationOpts
} from '@/convex/helpers/paginationHelpers';

// SCHEMAS
import { apartmentStatus, apartmentType } from '../schemas/accommodationsSchemas';

// TYPES
import type { Doc } from '@/convex/_generated/dataModel';
import type { PaginatedListPayload } from '@/shared/components/ui/data-table/types';

/** Lean row for the `/admin/accommodations` DataTable (and the user-detail Accommodations tab). */
export type AdminAccommodationRow = Pick<
	Doc<'apartments'>,
	'_id' | '_creationTime' | 'title' | 'slug' | 'city' | 'type' | 'pricePerNight' | 'status'
> & {
	imageUrl: string;
	hostId: string;
	hostName: string;
};

/**
 * Admin accommodation moderation table. Server-driven filters/sort/search for the
 * `convex-data-table` (offset strategy, like `listUsers`).
 *
 * Index pick: `hostId` → `by_host` (user-detail tab); price sort with a status
 * filter → `by_status_price`; status filter → `by_status`; price sort alone →
 * `by_price`; otherwise creation order. `type` and title search are post-scan
 * JS filters — neither is indexed and this is an admin tool.
 *
 * ponytail: offset mode collects matching rows (O(rows), same as fetchOptimized
 * offset). If the apartments table outgrows tens of thousands of rows, switch to
 * cursor pagination + a search index on title.
 */
export const listAccommodationsAdmin = query({
	args: {
		...paginatedQueryArgs,
		page: v.optional(v.number()),
		status: v.optional(apartmentStatus),
		type: v.optional(apartmentType),
		hostId: v.optional(v.string()),
		search: v.optional(v.string()),
		sortColumn: v.optional(v.union(v.literal('createdAt'), v.literal('price'))),
		sortDirection: v.optional(v.union(v.literal('asc'), v.literal('desc')))
	},
	handler: async (ctx, args): Promise<PaginatedListPayload<AdminAccommodationRow>> => {
		await requireAdmin(ctx);

		const order = args.sortDirection ?? 'desc';
		const priceSort = args.sortColumn === 'price';

		let indexed;
		if (args.hostId !== undefined) {
			const hostId = args.hostId;
			indexed = ctx.db.query('apartments').withIndex('by_host', (q) => q.eq('hostId', hostId));
		} else if (args.status !== undefined && priceSort) {
			const status = args.status;
			indexed = ctx.db
				.query('apartments')
				.withIndex('by_status_price', (q) => q.eq('status', status));
		} else if (args.status !== undefined) {
			const status = args.status;
			indexed = ctx.db.query('apartments').withIndex('by_status', (q) => q.eq('status', status));
		} else if (priceSort) {
			indexed = ctx.db.query('apartments').withIndex('by_price');
		} else {
			indexed = ctx.db.query('apartments');
		}

		const needle = args.search?.trim().toLowerCase();
		const all = (await indexed.order(order).collect()).filter((a) => {
			if (args.hostId !== undefined && args.status !== undefined && a.status !== args.status)
				return false;
			if (args.type !== undefined && a.type !== args.type) return false;
			if (needle && !a.title.toLowerCase().includes(needle)) return false;
			return true;
		});

		const { numItems } = resolvePaginationOpts(args.paginationOpts);
		const start = (normalizeOneBasedPage(args.page) - 1) * numItems;
		const slice = all.slice(start, start + numItems);

		// Dedupe host ids and batch the BA lookups — page-bounded, no N+1.
		const hostIds = [...new Set(slice.map((a) => a.hostId))];
		const hosts = new Map(
			await Promise.all(
				hostIds.map(async (id) => [id, await authComponent.getAnyUserById(ctx, id)] as const)
			)
		);

		return {
			page: slice.map((a) => ({
				_id: a._id,
				_creationTime: a._creationTime,
				title: a.title,
				slug: a.slug,
				city: a.city,
				type: a.type,
				pricePerNight: a.pricePerNight,
				status: a.status,
				imageUrl: a.images[0]?.url ?? '',
				hostId: a.hostId,
				hostName: hosts.get(a.hostId)?.name?.trim() || (hosts.get(a.hostId)?.email ?? '—')
			})),
			isDone: start + slice.length >= all.length,
			continueCursor: '',
			totalCount: all.length
		};
	}
});
