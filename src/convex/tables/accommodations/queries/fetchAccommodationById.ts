// LIBRARIES
import { v } from 'convex/values';

// SERVER
import { query } from '@/convex/_generated/server';

// HELPERS
import { getAuthUserId } from '@/convex/auth/helpers/getAuthUserId';

// TYPES
import type { Doc } from '@/convex/_generated/dataModel';

/**
 * Owner-scoped single-accommodation fetch for the edit page.
 *
 * Returns the apartment only when it exists AND belongs to the signed-in host;
 * otherwise `null` (the edit page renders a "not found" state). Returning `null`
 * rather than throwing for a missing/foreign id keeps other hosts' accommodations from
 * being probed through this endpoint.
 */
export const fetchAccommodationById = query({
	args: { id: v.id('apartments') },
	handler: async (ctx, { id }): Promise<Doc<'apartments'> | null> => {
		const hostId = await getAuthUserId(ctx);
		if (!hostId) return null;

		const apartment = await ctx.db.get(id);
		if (!apartment || apartment.hostId !== hostId) return null;

		return apartment;
	}
});
