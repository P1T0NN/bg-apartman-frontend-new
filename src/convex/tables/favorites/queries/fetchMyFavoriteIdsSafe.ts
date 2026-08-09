// LIBRARIES
import { v } from 'convex/values';
import { query } from '@/convex/_generated/server';

// CONFIG
import { FAVORITES_DATA } from '@/shared/config';

// UTILS
import { getAuthUserId } from '@/convex/auth/helpers/getAuthUserId';

/**
 * The signed-in user's saved listing ids. ONE subscription for the whole app: the root layout
 * pushes the result into `favoritesClass`, and every heart on every card reads that set — so a
 * search page with 30 cards costs one query, not 30.
 *
 * Ids only, on purpose. This runs on every page load, so it stays a single index read of the
 * thinnest rows in the database; the favorites PAGE resolves them to full listings
 * (`fetchFavoriteAccommodationsSafe`), which is a read only that page pays for.
 *
 * Signed out returns `[]` rather than throwing — the layout subscribes before it knows, and
 * the class falls back to `localStorage` for anonymous visitors.
 */
export const fetchMyFavoriteIdsSafe = query({
	args: {},
	returns: v.array(v.id('apartments')),
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return [];

		// `.take()`, not `.collect()`: this is the ceiling that keeps the hot-path payload
		// bounded no matter what the user's row count is (`FAVORITES_DATA.MAX_PER_USER`).
		const rows = await ctx.db
			.query('favorites')
			.withIndex('by_user', (q) => q.eq('userId', userId))
			.take(FAVORITES_DATA.MAX_PER_USER);

		return rows.map((row) => row.apartmentId);
	}
});
