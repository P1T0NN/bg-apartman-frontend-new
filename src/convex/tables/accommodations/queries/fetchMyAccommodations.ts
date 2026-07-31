// LIBRARIES
import { ConvexError, v } from 'convex/values';

// HELPERS
import { getAuthUserId } from '@/convex/auth/helpers/getAuthUserId';
import { fetchOptimized } from '@/convex/helpers/fetchOptimized';

// SCHEMAS
import { apartmentStatus } from '../schemas/accommodationsSchemas';

// TYPES
import type { QueryCtx } from '@/convex/_generated/server';
import type { ConvexErrorPayload } from '@/shared/types/types';

/** The signed-in host, or a typed throw — every access spec below starts here. */
async function requireHostId(ctx: QueryCtx): Promise<string> {
	const hostId = await getAuthUserId(ctx);
	if (!hostId) {
		throw new ConvexError({
			code: 'NOT_AUTHENTICATED',
			message: { key: 'GenericMessages.NOT_AUTHENTICATED' }
		} satisfies ConvexErrorPayload);
	}
	return hostId;
}

/**
 * Owner-scoped accommodation list for the signed-in host, with title search and a status
 * filter (HostSystemDesign.md §5 — a host with a real portfolio needs to find one listing,
 * not scroll eight at a time).
 *
 * Both narrowing paths stay INDEX-BOUNDED, which is the whole point of `fetchOptimized`:
 *
 *  - **status filter** → `by_host_status` (`[hostId, status]`), falling back to `by_host`
 *    when no status is chosen. Never `.filter()`, which would be post-scan;
 *  - **title search** → the `search_title` search index, with `hostId` (and `status` when
 *    set) as `filterFields`, so the search runs INSIDE the host's own slice.
 *
 * The two are mutually exclusive by construction: `where` returns null while a search term
 * is present and `search` returns null otherwise — the factory throws if both resolve, so
 * this is enforced, not merely intended. Search results come back relevance-ordered, which
 * is why the table disables its sort control while a search is active.
 */
export const fetchMyAccommodations = fetchOptimized({
	table: 'apartments',
	auth: 'user',
	args: {
		sortColumn: v.optional(v.string()),
		sortDirection: v.optional(v.union(v.literal('asc'), v.literal('desc'))),
		/** Debounced title query from the table's search box. Empty/absent = browse mode. */
		search: v.optional(v.string()),
		status: v.optional(apartmentStatus)
	},
	order: (args) => (args.sortColumn === 'createdAt' ? (args.sortDirection ?? 'desc') : 'desc'),
	where: async (ctx, args) => {
		// Search mode owns the request when a term is present.
		if (args.search?.trim()) return null;

		const hostId = await requireHostId(ctx);

		// `eq` keys must follow the index's field order — `by_host_status` is [hostId, status].
		return args.status
			? { index: 'by_host_status', eq: { hostId, status: args.status } }
			: { index: 'by_host', eq: { hostId } };
	},
	search: async (ctx, args) => {
		const query = args.search?.trim();
		if (!query) return null;

		const hostId = await requireHostId(ctx);

		return {
			index: 'search_title',
			searchField: 'title',
			query,
			// Scoped to the caller's own listings — a host can never search another's.
			eq: args.status ? { hostId, status: args.status } : { hostId }
		};
	}
});
