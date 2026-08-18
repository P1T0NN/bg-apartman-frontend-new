// LIBRARIES
import { ConvexError, v } from 'convex/values';
import { internal } from '@/convex/_generated/api';

// AUTH
import { adminAction } from '@/convex/auth/middleware/authMiddleware';

// ADAPTER
import { getPaymentAdapter } from '@/convex/payments/adapter';

// UTILS
import { listingIsListingFee } from '@/shared/features/accommodation/utils/listingFeeState';

// TYPES
import type { TranslatableMessage } from '@/convex/schemas/schemas';

type RefundResult =
	| { success: true; message: TranslatableMessage }
	| { success: false; message: TranslatableMessage };

/**
 * Admin refunds a paid listing fee (StripeTODO §8b). The boundary is server-side:
 * `listingIsListingFee` AND a Stripe `paymentRef` — a booking_fee listing never has one,
 * a free-granted listing never pays, so neither is refundable. A row already reset has no
 * paymentRef and is simply not refundable again (idempotent safe-pass).
 *
 * Stripe idempotency: `refund:` + paymentRef as the idempotency key, so a double-click or
 * a retry after a crash is ONE refund. Crash-between-refund-and-reset self-heals: paymentRef
 * is still set, the retry hits the same key, Stripe returns the existing refund, and the
 * reset runs. A Stripe failure returns REFUND_FAILED with the row untouched — no retry loop.
 *
 * Actions have no `ctx.db` — the state change lives in {@link resetListingAfterRefund}.
 */
export const refundListingFee = adminAction('refundListingFee')({
	args: {
		id: v.id('apartments'),
		// Translated on the frontend — the backend never writes display text. Stored as the
		// reset's `moderationReason` (same contract as `updateAccommodation`'s reason).
		reason: v.string(),
		// Rides to the reset so the refund email lands in the host's language.
		locale: v.optional(v.string())
	},
	handler: async (ctx, args): Promise<RefundResult> => {
		const apartment = await ctx.runQuery(
			internal.tables.accommodations.queries.fetchApartmentByIdInternal
				.fetchApartmentByIdInternal,
			{ id: args.id }
		);
		if (!apartment || !listingIsListingFee(apartment) || apartment.paymentRef === undefined) {
			return { success: false, message: { key: 'GenericMessages.FORBIDDEN' } };
		}

		const adapter = getPaymentAdapter();
		try {
			// Idempotency key: the same refund is one refund, however many times it's retried.
			await adapter.refund(apartment.paymentRef, `refund:${apartment.paymentRef}`);
		} catch (error) {
			// Config errors (STRIPE_NOT_CONFIGURED) surface as-is; provider failures become a
			// friendly toast. Row untouched — the host still has their coverage.
			if (error instanceof ConvexError) throw error;
			return {
				success: false,
				message: { key: 'GenericMessages.REFUND_LISTING_FEE_ERROR' }
			};
		}

		await ctx.runMutation(
			internal.tables.accommodations.mutations.resetListingAfterRefund
				.resetListingAfterRefund,
			{
				id: args.id,
				paymentRef: apartment.paymentRef,
				reason: args.reason,
				locale: args.locale,
				// The reset audits the admin as the actor — internal mutations have no ctx.userId.
				adminId: ctx.userId
			}
		);

		return {
			success: true,
			message: { key: 'GenericMessages.REFUND_LISTING_FEE_DONE' }
		};
	}
});
