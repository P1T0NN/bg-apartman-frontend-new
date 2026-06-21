// LIBRARIES
import { v } from 'convex/values';
import { paginationOptsValidator } from 'convex/server';

// UTILS
import { query } from '@/convex/_generated/server';
import { requireAdmin } from '@/convex/auth/middleware/authMiddleware';

// TYPES
import type { Doc } from '@/convex/_generated/dataModel';
import type { PaginatedListPayload } from '@/shared/components/ui/data-table/types';

/**
 * Paginated list for the admin audit-log viewer. Admin-only — audit data is
 * sensitive by definition. Newest entries first via `.order('desc')` over the
 * implicit `_creationTime` ordering on whichever index we pick.
 *
 * Filters are mutually exclusive — pick at most one of `userId` / `action` /
 * `resource`. Convex doesn't compose multiple `withIndex` filters in one read,
 * and combining them in-memory after pagination would break ordering.
 */
export const listAuditLogs = query({
	args: {
		paginationOpts: paginationOptsValidator,
		userId: v.optional(v.string()),
		action: v.optional(v.string()),
		resource: v.optional(v.object({ table: v.string(), id: v.string() })),
		// Sort by `_creationTime` only; column id is accepted (forwarded by DataTable)
		// but ignored since no other column is sort-eligible. Direction defaults to
		// `'desc'` to preserve the newest-first ordering.
		sortColumn: v.optional(v.string()),
		sortDirection: v.optional(v.union(v.literal('asc'), v.literal('desc')))
	},
	handler: async (ctx, args): Promise<PaginatedListPayload<Doc<'auditLogs'>>> => {
		await requireAdmin(ctx);

		const base = ctx.db.query('auditLogs');

		const filtered = args.userId
			? base.withIndex('by_user', (q) => q.eq('userId', args.userId))
			: args.action
				? base.withIndex('by_action', (q) => q.eq('action', args.action!))
				: args.resource
					? base.withIndex('by_resource', (q) =>
							q
								.eq('resource.table', args.resource!.table)
								.eq('resource.id', args.resource!.id)
						)
					: base;

		const result = await filtered
			.order(args.sortDirection ?? 'desc')
			.paginate(args.paginationOpts);

		return {
			page: result.page,
			isDone: result.isDone,
			continueCursor: result.continueCursor,
			// Cursor mode — full-table count would be O(rows) per page request.
			totalCount: null
		};
	}
});
