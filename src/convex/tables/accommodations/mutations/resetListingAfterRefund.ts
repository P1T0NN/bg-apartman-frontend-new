// LIBRARIES
import { v } from 'convex/values';

// CONFIG
import { ACCOMMODATIONS_CONFIG } from '@/shared/config';

// SERVER
import { internalMutation } from '@/convex/functions';

// AUTH
import { authComponent } from '@/convex/auth/auth';

// ANALYTICS
import { recordPlatformFeeRefund } from '@/convex/analytics';

// EMAIL
import { sendListingFeeRefundedEmail } from '@/convex/email/sendListingFeeRefundedEmail';

// UTILS
import { AUDIT_ACTIONS } from '@/convex/tables/auditLog/auditLogConfigs';
import { logAudit } from '@/convex/tables/auditLog/helpers/logAudit';

/**
 * The refund's state change, called by `refundListingFee` after Stripe's refund succeeded
 * (StripeTODO §8c). The listing goes back to its fee-unpaid start state: `pending_review`
 * awaits a fresh payment — the same gate a first-time listing starts behind.
 *
 * Idempotent: `paymentRef === args.paymentRef` guards the whole reset. A second run after a
 * crash-between-refund-and-reset is a no-op (the first run cleared paymentRef), so a
 * double-mutation can't double-reset or double-record the refund rollup.
 *
 * Existing bookings live out — blocking is automatic: status is no longer `published`, so
 * search/calendar never surfaces it for new stays (StripeTODO §8d).
 */
export const resetListingAfterRefund = internalMutation({
	args: {
		id: v.id('apartments'),
		paymentRef: v.string(),
		// Translated on the frontend (the refund action's caller) — the backend never writes
		// display text. Stored as `moderationReason`, same contract as `updateAccommodation`.
		reason: v.string(),
		/** Rides from the action so the refund email lands in the host's language. */
		locale: v.optional(v.string()),
		/** The acting admin's better-auth user id — internal mutations have no `ctx.userId`. */
		adminId: v.string()
	},
	returns: v.null(),
	handler: async (ctx, { id, paymentRef, reason, locale, adminId }) => {
		const apartment = await ctx.db.get(id);
		if (!apartment) return null;

		// Idempotency — already reset (paymentRef cleared) or a stale call for a different
		// payment: nothing to do, the refund rollup was already recorded.
		if (apartment.paymentRef !== paymentRef) return null;

		const now = Date.now();
		const { LISTING_FEE } = ACCOMMODATIONS_CONFIG;
		const statusBefore = apartment.status;
		const expiryBefore = apartment.apartmentSubscriptionExpiryDate;

		await ctx.db.patch(id, {
			// The money is back at Stripe — every trace of the paid period goes with it,
			// including a later free grant (paid → lapsed → granted → refunded: the grant's
			// coverage dies too, the host was repaid for the whole period).
			paymentRef: undefined,
			paidAt: undefined,
			paymentAmount: undefined,
			paymentOrderId: undefined,
			apartmentSubscriptionExpiryDate: undefined,
			feeReminderSentAt: undefined,
			freeGrantedAt: undefined,
			checkoutSessionId: undefined,
			checkoutSessionExpiresAt: undefined,
			// Replay guard memory: the stamp refuses a redelivered `checkout.session.completed`
			// whose paymentRef matches this — the money is back at the host (StripeTODO §6c).
			refundedPaymentRef: paymentRef,
			// The fee-unpaid start state — awaits a fresh payment, same as a first-time listing.
			status: 'pending_review',
			expiredReason: undefined,
			moderatedAt: now,
			moderatedBy: adminId,
			moderationReason: reason,
			updatedAt: now
		});

		// Platform revenue nets to zero for the refunded period — same amount and plan the
		// stamp recorded, idempotent on `paymentRef` (StripeTODO §7/§8c).
		await recordPlatformFeeRefund(ctx, paymentRef, LISTING_FEE.AMOUNT * 100);

		logAudit(ctx, AUDIT_ACTIONS.APARTMENT_FEE_REFUND, {
			userId: adminId,
			resource: { table: 'apartments', id },
			before: {
				status: statusBefore,
				expiry: expiryBefore ?? null,
				paymentRef
			},
			after: {
				status: 'pending_review',
				expiry: null,
				paymentRef: undefined
			},
			metadata: { amountEur: LISTING_FEE.AMOUNT, plan: 'listing_fee', reason: reason ?? null }
		});

		// The host hears the money moved — and that the road back is one payment, no re-review.
		const host = await authComponent.getAnyUserById(ctx, apartment.hostId);
		const hostEmail = host?.email?.trim();
		if (hostEmail) {
			await sendListingFeeRefundedEmail(ctx, {
				locale: locale ?? 'en',
				hostName: host?.name?.trim() || 'Host',
				hostEmail,
				apartmentTitle: apartment.title
			});
		}

		return null;
	}
});
