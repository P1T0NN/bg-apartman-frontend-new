// LIBRARIES
import { v } from 'convex/values';

// UTILS
import { authMutation } from '@/convex/auth/middleware/authMiddleware';

/**
 * Save / unsave one listing for the signed-in user. Returns the state the row is now in, so
 * the client can settle its optimistic update on the server's answer.
 *
 * Two document reads at most (existence check, then the listing) and one write. No count of
 * the user's set: `FAVORITES_DATA.MAX_PER_USER` is enforced by the READ's `.take()`, which is
 * the thing that had to stay cheap — counting here would read up to 200 rows on every heart
 * click to defend against a user who can only hurt their own page.
 *
 * ponytail: past the cap a save writes a row the read won't return, so the heart appears to
 * not stick. Only reachable by scripting 200+ saves on your own account. If that ever needs a
 * real answer, the upgrade is a counter namespaced by `userId` (see `defineCounters` in
 * `functions.ts`) — an O(log n) count instead of a 200-row read.
 *
 * Idempotent by construction: the state is derived from whether the row exists, never from
 * what the client believed, so a double-click can't leave two rows or a phantom one.
 */
export const toggleFavorite = authMutation('toggleFavorite')({
	args: { apartmentId: v.id('apartments') },
	returns: v.object({ saved: v.boolean() }),
	handler: async (ctx, args): Promise<{ saved: boolean }> => {
		const existing = await ctx.db
			.query('favorites')
			.withIndex('by_user_apartment', (q) =>
				q.eq('userId', ctx.userId).eq('apartmentId', args.apartmentId)
			)
			.unique();

		if (existing) {
			await ctx.db.delete(existing._id);
			return { saved: false };
		}

		// Trust boundary: `apartmentId` is client-supplied, so never store a row pointing at a
		// listing that doesn't exist. Reported as "not saved" — which is the truth.
		const apartment = await ctx.db.get(args.apartmentId);
		if (!apartment) return { saved: false };

		await ctx.db.insert('favorites', { userId: ctx.userId, apartmentId: args.apartmentId });

		return { saved: true };
	}
});
