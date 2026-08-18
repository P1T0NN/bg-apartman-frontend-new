// LIBRARIES
import { v } from 'convex/values';
import { internalMutation } from '@/convex/functions';

/**
 * Stamp (or clear) a listing's live Checkout Session — the only write the checkout action
 * is allowed to make, since actions have no `ctx.db`. Called by the action after a fresh
 * session is created; the fields are overwritten unconditionally, so a stale session
 * (expired at Stripe or in our store) is replaced in the same write.
 *
 * Not used by the webhook path — that is `stampListingFeePayment` (StripeTODO §6a).
 */
export const saveListingCheckoutSession = internalMutation({
	args: {
		id: v.id('apartments'),
		sessionId: v.optional(v.string()),
		expiresAt: v.optional(v.number())
	},
	returns: v.null(),
	handler: async (ctx, { id, sessionId, expiresAt }) => {
		await ctx.db.patch(id, {
			checkoutSessionId: sessionId,
			checkoutSessionExpiresAt: expiresAt,
			updatedAt: Date.now()
		});
		return null;
	}
});
