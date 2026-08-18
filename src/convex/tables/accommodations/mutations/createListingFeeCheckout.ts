// LIBRARIES
import { ConvexError, v } from 'convex/values';

// CONFIG
import { ACCOMMODATIONS_CONFIG } from '@/shared/config';

// AUTH
import { authAction } from '@/convex/auth/middleware/authMiddleware';

// ADAPTER
import { getPaymentAdapter } from '@/convex/payments/adapter';

// SERVER
import { internal } from '@/convex/_generated/api';

// UTILS
import { listingIsListingFee } from '@/shared/features/accommodation/utils/listingFeeState';

// TYPES
import type { ConvexErrorPayload } from '@/shared/types/types';
import type { TranslatableMessage } from '@/convex/schemas/schemas';

type CheckoutResult =
	| { success: true; redirectUrl: string }
	| { success: false; message: TranslatableMessage };

/**
 * Host starts paying (or renewing) the listing fee. Creates a Stripe Checkout Session and
 * returns the redirect URL — the redirect itself proves nothing, the webhook is the only
 * truth (StripeTODO §6a, § FOR LLMs).
 *
 * Gates, re-checked server-side: the listing is `listing_fee`, the host owns it, and its
 * status is payable — `pending_review` (the first payment unlocks going live) or `expired`
 * (a renewal). A `published`/`suspended` listing is not payable; a `booking_fee` listing
 * never pays a fee.
 *
 * Live-session guard: one payable session per listing, so a double-open can't spawn two
 * payable sessions for the same fee. Reuses the existing session's URL while it's live,
 * creates fresh once it's gone.
 *
 * Actions have no `ctx.db`, so every database touch goes through internal functions:
 * the apartment read via {@link fetchApartmentByIdInternal}, the write via
 * {@link saveListingCheckoutSession}.
 */
export const createListingFeeCheckout = authAction('createListingFeeCheckout')({
	args: {
		id: v.id('apartments'),
		successUrl: v.string(),
		cancelUrl: v.string(),
		// Rides on the session as metadata; the webhook hands it back so the published
		// email lands in the host's language.
		locale: v.string()
	},
	handler: async (ctx, args): Promise<CheckoutResult> => {
		const apartment = await ctx.runQuery(
			internal.tables.accommodations.queries.fetchApartmentByIdInternal
				.fetchApartmentByIdInternal,
			{ id: args.id }
		);
		if (!apartment || apartment.hostId !== ctx.userId) {
			return { success: false, message: { key: 'GenericMessages.FORBIDDEN' } };
		}

		// Throws PAYMENTS_DISABLED while PAYMENTS_CONFIG.PROVIDER is 'none'.
		const adapter = getPaymentAdapter();

		// Only a `listing_fee` listing ever pays a fee — `booking_fee` never does.
		if (!listingIsListingFee(apartment)) {
			return { success: false, message: { key: 'GenericMessages.FORBIDDEN' } };
		}

		// Payable: the first payment (`pending_review`) or a renewal (`expired`). A
		// published or suspended listing does not buy its way to anything else.
		if (apartment.status !== 'pending_review' && apartment.status !== 'expired') {
			return { success: false, message: { key: 'GenericMessages.FORBIDDEN' } };
		}

		const now = Date.now();

		// Live-session guard — reuse the open session's URL so a double-open stays one session.
		if (
			apartment.checkoutSessionId !== undefined &&
			apartment.checkoutSessionExpiresAt !== undefined &&
			apartment.checkoutSessionExpiresAt > now
		) {
			const existing = await adapter.retrieveCheckoutSession(apartment.checkoutSessionId);
			if (existing.url) return { success: true, redirectUrl: existing.url };
			// Session died at Stripe — fall through to a fresh one.
		}

		let session;
		try {
			session = await adapter.createListingFeeCheckout({
				amountEur: ACCOMMODATIONS_CONFIG.LISTING_FEE.AMOUNT,
				apartmentId: args.id,
				title: apartment.title,
				successUrl: args.successUrl,
				cancelUrl: args.cancelUrl,
				locale: args.locale
			});
		} catch (error) {
			// Config errors (STRIPE_NOT_CONFIGURED) surface as-is; provider failures become a
			// friendly "couldn't start" toast instead of a raw Stripe error.
			if (error instanceof ConvexError) throw error;
			throw new ConvexError({
				code: 'PAYMENT_START_FAILED',
				message: { key: 'GenericMessages.PAYMENT_START_FAILED' }
			} satisfies ConvexErrorPayload);
		}

		// Overwrite unconditionally — a stale session (expired at Stripe or in our store) is
		// replaced in the same write; the guard above never reuses a dead one.
		await ctx.runMutation(
			internal.tables.accommodations.mutations.saveListingCheckoutSession
				.saveListingCheckoutSession,
			{ id: args.id, sessionId: session.sessionId, expiresAt: session.expiresAt }
		);

		return { success: true, redirectUrl: session.url };
	}
});
