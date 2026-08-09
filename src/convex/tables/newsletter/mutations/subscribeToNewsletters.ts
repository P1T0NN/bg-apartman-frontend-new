// LIBRARIES
import { zodToConvexFields } from 'convex-helpers/server/zod4';
import { mutation } from '@/convex/_generated/server';

// UTILS
import { convexRateLimiter } from '@/convex/convexRateLimiter';

// SCHEMAS
import { newsletterSchema } from '@/shared/features/newsletter/schemas/newsletterSchemas';
import { mutationResult, type MutationResult } from '@/convex/schemas/schemas';

/**
 * Subscribe an email to the marketing newsletter. Public (no auth).
 *
 * Args are DERIVED from the shared `newsletterSchema` — the same object the form validates
 * against — and the handler re-runs it authoritatively. One definition, both sides.
 * A schema failure here means a client bypassed validation, so it collapses to the generic
 * envelope rather than surfacing per-issue copy (the backend holds no display strings).
 *
 * Idempotent and always reports generic success — an already-subscribed email is a no-op, so
 * the response never reveals whether the address was already on the list.
 */
export const subscribeToNewsletter = mutation({
	args: zodToConvexFields(newsletterSchema.shape),
	returns: mutationResult,
	handler: async (ctx, args): Promise<MutationResult> => {
		const parsed = newsletterSchema.safeParse(args);
		if (!parsed.success) {
			return { success: false, message: { key: 'GenericMessages.UNEXPECTED_ERROR' } };
		}

		// The schema already trimmed; lowercase so `by_email` matches whatever casing was typed.
		const email = parsed.data.email.toLowerCase();

		// Public endpoint, no session to key on — the submitted email is the identity
		// (`limitPresets.publicWrite`). Charged after normalizing so casing can't buy a
		// fresh bucket, and before the insert so a refused call writes nothing.
		await convexRateLimiter.limit(ctx, 'subscribeToNewsletter', { key: email, throws: true });

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
