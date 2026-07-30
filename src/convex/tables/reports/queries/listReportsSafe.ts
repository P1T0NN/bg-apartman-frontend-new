// LIBRARIES
import { v } from 'convex/values';
import { query } from '@/convex/_generated/server';

// UTILS
import { requireAdmin } from '@/convex/auth/middleware/authMiddleware';
import {
	paginatedQueryArgs,
	normalizeOneBasedPage,
	resolvePaginationOpts
} from '@/convex/helpers/paginationHelpers';

// SCHEMAS
import { reportCategory, reportStatus } from '../schemas/reportsSchemas';

// TYPES
import type { Doc } from '@/convex/_generated/dataModel';
import type { PaginatedListPayload } from '@/components/ui/data-table/types';

/** One inbox row. `status` is normalized, so the UI never repeats the `?? 'new'` dance. */
export type AdminReportRow = Omit<Doc<'reports'>, 'status'> & {
	status: NonNullable<Doc<'reports'>['status']>;
};

/**
 * The `/admin/reports` inbox feed (AdminPagesSystemDesign.md §4) — newest first, filtered
 * by status and/or category.
 *
 * The `'new'` filter reads TWO index slices and merges them: an index match is exact, so
 * `eq('status', 'new')` cannot see rows filed before the field existed (they stored
 * nothing). Reading the `undefined` slice alongside it is what makes "absent means new"
 * true at the query layer, matching the aggregate's `?? 'new'` namespace.
 *
 * ponytail: offset pagination over the matched set, same class as the other admin lists.
 * Reports are a low-volume table; switch to cursor pagination if that ever changes.
 */
export const listReportsSafe = query({
	args: {
		...paginatedQueryArgs,
		page: v.optional(v.number()),
		status: v.optional(reportStatus),
		category: v.optional(reportCategory)
	},
	handler: async (ctx, args): Promise<PaginatedListPayload<AdminReportRow>> => {
		await requireAdmin(ctx);

		let rows: Doc<'reports'>[];
		if (args.status === 'new') {
			const [stamped, legacy] = await Promise.all([
				ctx.db
					.query('reports')
					.withIndex('by_status', (q) => q.eq('status', 'new'))
					.order('desc')
					.collect(),
				ctx.db
					.query('reports')
					.withIndex('by_status', (q) => q.eq('status', undefined))
					.order('desc')
					.collect()
			]);
			// Both slices are newest-first; merge and re-sort so the union is too.
			rows = [...stamped, ...legacy].sort((a, b) => b._creationTime - a._creationTime);
		} else if (args.status !== undefined) {
			const status = args.status;
			rows = await ctx.db
				.query('reports')
				.withIndex('by_status', (q) => q.eq('status', status))
				.order('desc')
				.collect();
		} else {
			rows = await ctx.db.query('reports').order('desc').collect();
		}

		const all = rows.filter((r) => args.category === undefined || r.category === args.category);

		const { numItems } = resolvePaginationOpts(args.paginationOpts);
		const start = (normalizeOneBasedPage(args.page) - 1) * numItems;
		const slice = all.slice(start, start + numItems);

		return {
			page: slice.map((r) => ({ ...r, status: r.status ?? ('new' as const) })),
			isDone: start + slice.length >= all.length,
			continueCursor: '',
			totalCount: all.length
		};
	}
});
