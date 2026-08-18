// LIBRARIES
import { v } from 'convex/values';
import { internalMutation } from '@/convex/functions';

/**
 * Forget a Checkout Session that died unpaid — called by the webhook on
 * `checkout.session.expired`. Lookup is by `_id` (`client_reference_id` on the event), so
 * no scan; the equality check is the guard: a session superseded by a fresh one must not be
 * cleared by a stale expiry event for the old one. No audit — a session that just died, no
 * money (StripeTODO §6d).
 */
export const clearExpiredCheckout = internalMutation({
	args: {
		apartmentId: v.id('apartments'),
		sessionId: v.string()
	},
	returns: v.null(),
	handler: async (ctx, { apartmentId, sessionId }) => {
		const apartment = await ctx.db.get(apartmentId);
		if (!apartment || apartment.checkoutSessionId !== sessionId) return null;

		await ctx.db.patch(apartmentId, {
			checkoutSessionId: undefined,
			checkoutSessionExpiresAt: undefined,
			updatedAt: Date.now()
		});
		return null;
	}
});
