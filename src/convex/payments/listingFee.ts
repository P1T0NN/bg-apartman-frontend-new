// LIBRARIES
import { v } from 'convex/values';
import { action, internalQuery } from '@/convex/_generated/server';
import { internalMutation } from '@/convex/functions';

// CONFIG
import { ACCOMMODATIONS_CONFIG } from '@/shared/config';

// UTILS
import { internal } from '@/convex/_generated/api';
import { adminMutation } from '@/convex/auth/middleware/authMiddleware';
import { requireAuthUserId } from '@/convex/auth/helpers/requireAuthUserId';
import { paymentsAdapter, onlinePaymentsEnabled } from '@/convex/payments/adapter';
import { AUDIT_ACTIONS } from '@/convex/tables/auditLog/auditLogConfigs';
import { nextSubscriptionExpiry } from '@/shared/features/accommodation/utils/nextSubscriptionExpiry';
import { listingIsListingFee } from '@/shared/features/accommodation/utils/listingFeeState';
import { analytics, ANALYTICS_EVENT } from '@/convex/analytics';

// SCHEMAS
import { mutationResult, type MutationResult } from '@/convex/schemas/schemas';

// TYPES
import type { Id } from '@/convex/_generated/dataModel';
import type { MutationCtx } from '@/convex/_generated/server';

/**
 * Flow A of the money design — host pays the platform to stay listed
 * (AccommodationsSystemDesign.md §8, PaymentsSystemDesign.md §1 flow A).
 *
 * Two ways a payment lands, one place it is applied:
 *  - {@link renewListing} — the host pays through the provider adapter's `charge()`;
 *  - {@link stampListingFeePayment} — an admin records a bank transfer by hand,
 *    audit-logged. §8 names this as the sanctioned path "until a provider is wired", which
 *    is exactly today.
 *
 * No Connect, no payout machinery: this is a plain one-time charge from host to platform.
 */

/**
 * Apply a paid listing-fee period. The ONE place the four legacy payment fields are
 * stamped together, so the two entry points cannot drift.
 *
 * `expired` → `published` directly, no re-review: content was already approved and paying
 * again is not a content event (§1's transition rules). This is the sole non-admin route
 * into `published`, and it is why it lives behind a payment rather than a button.
 */
async function applyListingFeePayment(
	ctx: MutationCtx,
	apartmentId: Id<'apartments'>,
	payment: { amount: number; orderId: string }
): Promise<MutationResult> {
	const apartment = await ctx.db.get(apartmentId);
	// Only a `listing_fee` listing has a fee to pay (ASD §8) — both entry points share
	// this gate, so a stamp on a `booking_fee` row (or under `'none'`) cannot happen.
	if (!apartment || !listingIsListingFee(apartment)) {
		return { success: false, message: { key: 'GenericMessages.FORBIDDEN' } };
	}

	const now = Date.now();
	const { PERIOD_DAYS, GRACE_DAYS } = ACCOMMODATIONS_CONFIG.LISTING_FEE;

	await ctx.db.patch(apartmentId, {
		paidAt: now,
		paymentAmount: payment.amount,
		paymentOrderId: payment.orderId,
		apartmentSubscriptionExpiryDate: nextSubscriptionExpiry(
			now,
			apartment.apartmentSubscriptionExpiryDate,
			PERIOD_DAYS,
			GRACE_DAYS
		),
		// A fresh period gets a fresh reminder — this is what stops the sweep re-sending.
		feeReminderSentAt: undefined,
		// Renewal returns an expired listing straight to live; every other status is
		// untouched (a suspended listing does not buy its way back — §1).
		...(apartment.status === 'expired'
			? { status: 'published' as const, expiredReason: undefined }
			: {}),
		updatedAt: now
	});

	// Platform revenue, stream 1 of 2 (ASD §8 "platform-revenue events"): the listing fee
	// became the platform's money the moment it landed. `/admin/dashboard` reads this.
	await analytics.track(ctx, ANALYTICS_EVENT.INVOICE_PAID, {
		properties: { amountCents: payment.amount * 100, currency: 'EUR', plan: 'listing_fee' }
	});

	return { success: true, message: { key: 'GenericMessages.LISTING_FEE_PAID' } };
}

/**
 * Ownership + model gate for the host renewal action, which has no `ctx.db` of its own:
 * only the owner may pay, and only a `listing_fee` listing has anything to pay for
 * (ASD §8 — `booking_fee` rows never see a fee surface).
 */
export const isListingOwnedBy = internalQuery({
	args: { apartmentId: v.id('apartments'), hostId: v.string() },
	returns: v.boolean(),
	handler: async (ctx, args) => {
		const apartment = await ctx.db.get(args.apartmentId);
		return apartment !== null && apartment.hostId === args.hostId && listingIsListingFee(apartment);
	}
});

/** Internal twin of {@link applyListingFeePayment} for the action-driven host renewal. */
export const recordListingFeePayment = internalMutation({
	args: {
		apartmentId: v.id('apartments'),
		amount: v.number(),
		orderId: v.string()
	},
	returns: mutationResult,
	handler: async (ctx, args): Promise<MutationResult> =>
		applyListingFeePayment(ctx, args.apartmentId, {
			amount: args.amount,
			orderId: args.orderId
		})
});

/**
 * Host renews their own listing (§8 "Renewal"). An action because `charge()` is network
 * I/O, and the charge must succeed before any period is granted — money first, then the
 * record of it, same ordering as every other payment path in this codebase.
 *
 * While no provider is wired this returns a "contact us" message rather than throwing: the
 * host's road back must stay obvious even when the automated path doesn't exist yet, and
 * the admin manual stamp is the documented alternative.
 */
export const renewListing = action({
	args: { apartmentId: v.id('apartments') },
	returns: mutationResult,
	handler: async (ctx, args): Promise<MutationResult> => {
		const hostId = await requireAuthUserId(ctx);
		const owns = await ctx.runQuery(internal.payments.listingFee.isListingOwnedBy, {
			apartmentId: args.apartmentId,
			hostId
		});
		if (!owns) return { success: false, message: { key: 'GenericMessages.FORBIDDEN' } };

		if (!onlinePaymentsEnabled()) {
			return { success: false, message: { key: 'GenericMessages.RENEWAL_NEEDS_SUPPORT' } };
		}

		const amount = ACCOMMODATIONS_CONFIG.LISTING_FEE.AMOUNT;

		let orderId: string;
		try {
			orderId = await paymentsAdapter.charge(amount, {
				kind: 'listing_fee',
				apartmentId: args.apartmentId
			});
		} catch {
			return { success: false, message: { key: 'GenericMessages.LISTING_FEE_CHARGE_FAILED' } };
		}

		return await ctx.runMutation(internal.payments.listingFee.recordListingFeePayment, {
			apartmentId: args.apartmentId,
			amount,
			orderId
		});
	}
});

/**
 * Admin records a listing-fee payment received outside the platform (bank transfer) —
 * §8's named stand-in until the provider adapter is live. Audit-logged because it is a
 * human granting paid time with no money trail of its own; the audit entry IS the trail.
 */
export const stampListingFeePayment = adminMutation('stampListingFeePayment')({
	args: {
		apartmentId: v.id('apartments'),
		/** Whole euros actually received. Defaults to the configured fee. */
		amount: v.optional(v.number()),
		/** Bank reference / however the operator identifies the transfer. */
		reference: v.string()
	},
	returns: mutationResult,
	handler: async (ctx, args): Promise<MutationResult> => {
		const apartment = await ctx.db.get(args.apartmentId);
		if (!apartment) return { success: false, message: { key: 'GenericMessages.FORBIDDEN' } };

		const amount = args.amount ?? ACCOMMODATIONS_CONFIG.LISTING_FEE.AMOUNT;
		const result = await applyListingFeePayment(ctx, args.apartmentId, {
			amount,
			orderId: args.reference.trim()
		});
		if (!result.success) return result;

		const patched = await ctx.db.get(args.apartmentId);

		ctx.audit(AUDIT_ACTIONS.APARTMENT_FEE_STAMP, {
			resource: { table: 'apartments', id: args.apartmentId },
			before: {
				status: apartment.status,
				expiry: apartment.apartmentSubscriptionExpiryDate ?? null
			},
			after: {
				status: patched?.status ?? apartment.status,
				expiry: patched?.apartmentSubscriptionExpiryDate ?? null
			},
			metadata: { amount, reference: args.reference.trim(), manual: true }
		});

		return result;
	}
});
