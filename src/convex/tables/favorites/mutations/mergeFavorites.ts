// LIBRARIES
import { v } from 'convex/values';

// CONFIG
import { FAVORITES_DATA } from '@/shared/config';

// UTILS
import { authMutation } from '@/convex/auth/middleware/authMiddleware';

/**
 * Fold a device's anonymous saved listings into the signed-in user's set.
 *
 * The guest counterpart of `claimMyBookings`: a visitor can save listings before they have an
 * account (hearts in `localStorage`), and signing in must not silently throw that away. Called
 * once by `favoritesClass` when it first sees an authenticated session with local ids present,
 * which then clears `localStorage` so the merge can't run twice.
 *
 * Bounded on purpose — `MAX_MERGE` ids, deduped, skipping rows that already exist and ids whose
 * listing is gone (both are ordinary: the same device may have signed in before, and a saved
 * listing may have been deleted meanwhile). Returns how many rows were added, which is what the
 * caller needs to decide whether to say anything to the user.
 */
export const mergeFavorites = authMutation('mergeFavorites')({
	args: { apartmentIds: v.array(v.id('apartments')) },
	returns: v.object({ added: v.number() }),
	handler: async (ctx, args): Promise<{ added: number }> => {
		const ids = [...new Set(args.apartmentIds)].slice(0, FAVORITES_DATA.MAX_MERGE);

		let added = 0;

		for (const apartmentId of ids) {
			const existing = await ctx.db
				.query('favorites')
				.withIndex('by_user_apartment', (q) =>
					q.eq('userId', ctx.userId).eq('apartmentId', apartmentId)
				)
				.unique();
			if (existing) continue;

			const apartment = await ctx.db.get(apartmentId);
			if (!apartment) continue;

			await ctx.db.insert('favorites', { userId: ctx.userId, apartmentId });
			added += 1;
		}

		return { added };
	}
});
