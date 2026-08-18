// LIBRARIES
import { v } from 'convex/values';

// CONFIG
import { ACCOMMODATIONS_CONFIG } from '@/shared/config';

// SERVER
import { internalMutation } from '@/convex/functions';

// AUTH
import { authComponent } from '@/convex/auth/auth';

// ANALYTICS
import { recordPlatformRevenue } from '@/convex/analytics';

// EMAIL
import { sendAccommodationPublishedEmail } from '@/convex/email/sendAccommodationPublishedEmail';

// UTILS
import { AUDIT_ACTIONS } from '@/convex/tables/auditLog/auditLogConfigs';
import { logAudit } from '@/convex/tables/auditLog/helpers/logAudit';
import { nextSubscriptionExpiry } from '@/shared/features/accommodation/utils/nextSubscriptionExpiry';
import { listingIsListingFee } from '@/shared/features/accommodation/utils/listingFeeState';

// TYPES
import type { Doc } from '@/convex/_generated/dataModel';

/** Payment-triggered publish has no admin actor; the stamp is the actor. */
const PAYMENT_MODERATOR = 'system:stripe';

/**
 * The money event — called by the Stripe webhook on `checkout.session.completed` (and
 * nowhere else). Load-bearing rules, all enforced here because the webhook is a thin
 * pass-through:
 *
 *   - **Idempotent**: a redelivered webhook must not double-stamp, double-publish, or
 *     double-bill. `paymentRef` set → no-op, and a `refundedPaymentRef` match after a
 *     refund → no-op (the money is back at the host).
 *   - **Verified against Stripe truth, not the session**: the amount and currency must
 *     match `LISTING_FEE` exactly. A mismatch means the price changed between
 *     session-create and pay → refuse to stamp (flagged for admin, never auto-looped).
 *   - **`listingIsListingFee` re-checked**: the one-way monetization switch could have
 *     fired mid-checkout. Switched → do not publish; money sits at Stripe, admin resolves.
 *   - **The stamp publishes** whatever the fee was blocking: `pending_review` publishes
 *     (the fee was the only gate to the moderation queue) and `expired` revives to
 *     `published` — same branch as `grantFreePublish`.
 */
export const stampListingFeePayment = internalMutation({
	args: {
		apartmentId: v.id('apartments'),
		paymentRef: v.string(),
		/** Cents, from the session's `amount_total`. */
		amountTotal: v.number(),
		currency: v.string(),
		/** Rode back from the checkout session's `metadata.locale` — for the published email. */
		locale: v.optional(v.string())
	},
	returns: v.null(),
	handler: async (ctx, { apartmentId, paymentRef, amountTotal, currency, locale }) => {
		const apartment: Doc<'apartments'> | null = await ctx.db.get(apartmentId);
		// Listing deleted mid-checkout: nothing to stamp, nothing to publish.
		if (!apartment) return null;

		// Idempotency — a redelivered `checkout.session.completed` stops here.
		if (apartment.paymentRef !== undefined) return null;

		// Replay guard — the fee was refunded and the host has the money back; the refund
		// reset wrote the memory on the row. A redelivery of THIS event must not republish.
		if (apartment.refundedPaymentRef === paymentRef) return null;

		// Verify against Stripe truth, never the session we created. Bad amount/currency →
		// no stamp, no publish. A mismatch here is an anomaly for an admin, not a retry loop.
		const { LISTING_FEE } = ACCOMMODATIONS_CONFIG;
		if (amountTotal !== LISTING_FEE.AMOUNT * 100 || currency !== 'eur') return null;

		// The one-way monetization switch could have flipped mid-checkout — a `booking_fee`
		// row must not publish off a listing-fee payment. Money stays at Stripe, admin handles.
		if (!listingIsListingFee(apartment)) return null;

		const now = Date.now();

		// Inside grace this extends from the old expiry — a host who pays a few days late
		// gets exactly the coverage they paid for (continuity rule, same as a grant).
		const expiry = nextSubscriptionExpiry(
			now,
			apartment.apartmentSubscriptionExpiryDate,
			LISTING_FEE.PERIOD_DAYS,
			LISTING_FEE.GRACE_DAYS
		);

		// The fee was the only gate between `pending_review` and the queue's approval, and
		// between `expired` and live again — same branch grantFreePublish takes.
		const shouldPublish = apartment.status === 'expired' || apartment.status === 'pending_review';

		await ctx.db.patch(apartmentId, {
			paymentRef,
			paymentAmount: LISTING_FEE.AMOUNT,
			paidAt: now,
			apartmentSubscriptionExpiryDate: expiry,
			// A fresh period gets a fresh T−7 reminder.
			feeReminderSentAt: undefined,
			// The session is spent either way — completed means it's consumed.
			checkoutSessionId: undefined,
			checkoutSessionExpiresAt: undefined,
			// A payment replaces any earlier free-grant marker.
			freeGrantedAt: undefined,
			...(shouldPublish
				? {
						status: 'published' as const,
						expiredReason: undefined,
						moderatedAt: now,
						moderatedBy: PAYMENT_MODERATOR,
						moderationReason: undefined
					}
				: {}),
			updatedAt: now
		});

		// Platform revenue — day-keyed SUM rollup, idempotent on `paymentRef` (StripeTODO §7).
		await recordPlatformRevenue(ctx, paymentRef, amountTotal);

		// System action (webhook-triggered), so no `userId` — the stamp is the actor.
		logAudit(ctx, AUDIT_ACTIONS.APARTMENT_FEE_STAMP, {
			resource: { table: 'apartments', id: apartmentId },
			before: {
				status: apartment.status,
				expiry: apartment.apartmentSubscriptionExpiryDate ?? null
			},
			after: {
				status: shouldPublish ? 'published' : apartment.status,
				expiry,
				paymentRef
			},
			metadata: { amountEur: LISTING_FEE.AMOUNT, plan: 'listing_fee' }
		});

		// The host hears "you're live" once, from whichever payment path did it. Already
		// published rows (status changed while the session was open) get no second email.
		if (shouldPublish) {
			const host = await authComponent.getAnyUserById(ctx, apartment.hostId);
			const hostEmail = host?.email?.trim();
			if (hostEmail) {
				await sendAccommodationPublishedEmail(ctx, {
					locale: locale ?? 'en',
					apartmentId,
					hostName: host?.name?.trim() || 'Host',
					hostEmail,
					apartmentTitle: apartment.title,
					city: apartment.city
				});
			}
		}

		return null;
	}
});
