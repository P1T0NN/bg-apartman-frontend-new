// CONFIG
import { ACCOMMODATIONS_CONFIG } from '@/shared/config';

// AUTH
import { authComponent } from '@/convex/auth/auth';

// EMAIL
import { sendAccommodationPublishedEmail } from '@/convex/email/sendAccommodationPublishedEmail';

// UTILS
import { zAdminMutation } from '@/convex/auth/middleware/authMiddleware';
import { AUDIT_ACTIONS } from '@/convex/tables/auditLog/auditLogConfigs';
import { nextSubscriptionExpiry } from '@/shared/features/accommodation/utils/nextSubscriptionExpiry';
import {
	FREE_LISTING_FOREVER_EXPIRY,
	listingIsListingFee
} from '@/shared/features/accommodation/utils/listingFeeState';

// SCHEMAS
import { grantFreePublishSchema } from '@/shared/features/accommodation/schemas/accommodationsSchemas';
import { mutationResult, type MutationResult } from '@/convex/schemas/schemas';

/**
 * Calendar lengths an admin can grant, in days (3m = 90 == `LISTING_FEE.PERIOD_DAYS`, so a
 * 3-month grant equals one bought period). `forever` is handled separately below.
 */
const GRANT_DAYS = { '1m': 30, '3m': 90, '6m': 182, '1y': 365 } as const;

/**
 * Admin grants a listing-fee waiver — "free publish" (AccommodationsSystemDesign.md §8's
 * first-period gate, waived). The listing gets the same coverage a payment would stamp on
 * `apartmentSubscriptionExpiryDate`, but deliberately NOT the payment fields (`paidAt` /
 * `paymentAmount` / `paymentOrderId`) and NOT the `INVOICE_PAID` analytics event — so
 * `/admin/dashboard` revenue is untouched: nobody paid, and the row says so honestly
 * (the same honesty rule as the monetization backfill).
 *
 * The grant also performs the publish the fee would unlock, in the same go — that's the
 * "publish" half of the name: a `pending_review` listing publishes immediately (the fee
 * gate was the only thing between it and the queue's approval), and an `expired` listing
 * revives straight to `published` (its content was already approved). Both get the
 * host's standard published email. A `suspended` listing stays suspended — a suspended
 * listing does not buy its way back, free or otherwise (same rule as the payment and
 * moderation paths); it still needs an explicit Publish.
 */
export const grantFreePublish = zAdminMutation('grantFreePublish')({
	// The whole shared schema IS the args — no parallel v.* block (zAuthMutation pattern).
	args: grantFreePublishSchema,
	handler: async (ctx, args): Promise<MutationResult> => {
		const apartment = await ctx.db.get(args.id);
		// Only a `listing_fee` listing has a fee to waive — same gate as the payment paths.
		if (!apartment || !listingIsListingFee(apartment)) {
			return { success: false, message: { key: 'GenericMessages.FORBIDDEN' } };
		}

		const now = Date.now();
		const { GRACE_DAYS } = ACCOMMODATIONS_CONFIG.LISTING_FEE;

		const expiry =
			args.duration === 'forever'
				? FREE_LISTING_FOREVER_EXPIRY
				: nextSubscriptionExpiry(
						now,
						apartment.apartmentSubscriptionExpiryDate,
						GRANT_DAYS[args.duration],
						GRACE_DAYS
					);

		// The grant publishes whatever the fee was blocking: `expired` revives and
		// `pending_review` publishes in the same go (see doc comment). The patch mirrors
		// `moderateApartmentStatus`'s publish fields so the row lands exactly as if the
		// admin had hit Publish after the fee was covered.
		const shouldPublish = apartment.status === 'expired' || apartment.status === 'pending_review';

		await ctx.db.patch(args.id, {
			apartmentSubscriptionExpiryDate: expiry,
			// A fresh period gets a fresh reminder — same rule as a payment.
			feeReminderSentAt: undefined,
			...(shouldPublish
				? {
						status: 'published' as const,
						moderatedAt: now,
						moderatedBy: ctx.userId,
						moderationReason: undefined,
						expiredReason: undefined
					}
				: {}),
			updatedAt: now
		});

		ctx.audit(AUDIT_ACTIONS.APARTMENT_FREE_PUBLISH, {
			resource: { table: 'apartments', id: args.id },
			before: {
				status: apartment.status,
				expiry: apartment.apartmentSubscriptionExpiryDate ?? null
			},
			after: {
				status: shouldPublish ? 'published' : apartment.status,
				expiry
			},
			metadata: { duration: args.duration, free: true }
		});

		// Same host email the Publish action sends — the host should hear the good news
		// exactly once, from whichever admin path did it.
		if (shouldPublish) {
			const host = await authComponent.getAnyUserById(ctx, apartment.hostId);
			const hostEmail = host?.email?.trim();
			if (hostEmail) {
				await sendAccommodationPublishedEmail(ctx, {
					locale: args.locale ?? 'en',
					apartmentId: args.id,
					hostName: host?.name?.trim() || 'Host',
					hostEmail,
					apartmentTitle: apartment.title,
					city: apartment.city
				});
			}
		}

		return { success: true, message: { key: 'GenericMessages.FREE_PUBLISH_GRANTED' } };
	}
});
