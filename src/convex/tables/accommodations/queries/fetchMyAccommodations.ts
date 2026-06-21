// LIBRARIES
import { ConvexError, v } from 'convex/values';

// HELPERS
import { getAuthUserId } from '@/convex/auth/helpers/getAuthUserId';
import { fetchOptimized } from '@/convex/helpers/fetchOptimized';

// TYPES
import type { ConvexErrorPayload } from '@/convex/types/convexTypes';

/**
 * Owner-scoped accommodation list for the signed-in host.
 *
 * Uses the `apartments.by_host` index so the query only scans the caller's rows,
 * then paginates with Convex cursor pagination. Newest listings are returned first
 * by default via the helper's `order: 'desc'`.
 */
export const fetchMyAccommodations = fetchOptimized({
	table: 'apartments',
	auth: 'user',
	args: {
		sortColumn: v.optional(v.string()),
		sortDirection: v.optional(v.union(v.literal('asc'), v.literal('desc')))
	},
	order: (args) => (args.sortColumn === 'createdAt' ? (args.sortDirection ?? 'desc') : 'desc'),
	where: async (ctx) => {
		const hostId = await getAuthUserId(ctx);
		if (!hostId) {
			throw new ConvexError({
				code: 'NOT_AUTHENTICATED',
				message: { key: 'GenericMessages.NOT_AUTHENTICATED' }
			} satisfies ConvexErrorPayload);
		}

		return {
			index: 'by_host',
			eq: { hostId }
		};
	}
});
