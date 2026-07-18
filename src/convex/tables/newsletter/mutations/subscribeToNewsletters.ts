// LIBRARIES
import { v } from 'convex/values';
import { mutation } from '@/convex/_generated/server';

// SCHEMAS
import { mutationResult } from '@/convex/schemas/schemas';

/**
 * Subscribe an email to the marketing newsletter. Public (no auth).
 *
 * Idempotent and always reports generic success — an already-subscribed email is a no-op, so
 * the response never reveals whether the address was already on the list.
 */
export const subscribeToNewsletter = mutation({
	args: { email: v.string() },
	returns: mutationResult,
	handler: async (ctx, args) => {
		const email = args.email.trim().toLowerCase();

		const existing = await ctx.db
			.query('newsletter')
			.withIndex('by_email', (q) => q.eq('email', email))
			.first();

		if (!existing) {
			await ctx.db.insert('newsletter', { email });
		}

		return { success: true, message: { key: 'GenericMessages.NEWSLETTER_SUBSCRIBED' } };
	}
});
