// LIBRARIES
import { v } from 'convex/values';

// UTILS
import { authMutation } from '@/convex/auth/middleware/authMiddleware';
import { onlinePaymentsEnabled } from '@/convex/payments/adapter';
import { AUDIT_ACTIONS } from '@/convex/tables/auditLog/auditLogConfigs';
import {
	monetizationActive,
	listingIsListingFee
} from '@/shared/features/accommodation/utils/listingFeeState';

// SCHEMAS
import { mutationResult, type MutationResult } from '@/convex/schemas/schemas';

/**
 * The ONE-WAY model switch (ASD §8 "Switching models"): `listing_fee` → `booking_fee`,
 * never back. The reverse direction is not an argument this mutation accepts — there is
 * no `target` parameter, because only one target exists.
 *
 * Rules, all from §8:
 *  - requires the `booking_fee` preconditions: monetization on, provider live, and the
 *    listing goes online-only in the same patch (the model and the payment method are one
 *    fact);
 *  - immediate — remaining paid days are forfeited (the dialog said so; no proration, no
 *    refund machinery). Payment stamps stay on the row as history;
 *  - in-flight bookings are untouched: `platformFee` is a creation-time snapshot (§0.3);
 *  - audit-logged: an irreversible host action leaves a trail.
 */
export const switchListingMonetization = authMutation('switchListingMonetization')({
	args: { id: v.id('apartments') },
	returns: mutationResult,
	handler: async (ctx, args): Promise<MutationResult> => {
		const apartment = await ctx.db.get(args.id);
		if (!apartment || apartment.hostId !== ctx.userId) {
			return { success: false, message: { key: 'GenericMessages.FORBIDDEN' } };
		}

		if (!monetizationActive() || !onlinePaymentsEnabled()) {
			return { success: false, message: { key: 'GenericMessages.ONLINE_PAYMENTS_UNAVAILABLE' } };
		}

		// Only a `listing_fee` listing can switch; a `booking_fee` listing asking for ANY
		// change hits the one-way door (§8 — their road is archive + recreate).
		if (!listingIsListingFee(apartment)) {
			return { success: false, message: { key: 'GenericMessages.MONETIZATION_SWITCH_FORBIDDEN' } };
		}

		await ctx.db.patch(args.id, {
			monetization: 'booking_fee',
			// Online-only by construction (§8) — the model closes the cash door itself.
			paymentMethod: 'online',
			updatedAt: Date.now()
		});

		ctx.audit(AUDIT_ACTIONS.APARTMENT_MONETIZATION_SWITCH, {
			resource: { table: 'apartments', id: args.id },
			before: {
				monetization: 'listing_fee',
				expiry: apartment.apartmentSubscriptionExpiryDate ?? null,
				paymentMethod: apartment.paymentMethod ?? 'cash'
			},
			after: { monetization: 'booking_fee', paymentMethod: 'online' }
		});

		return { success: true, message: { key: 'GenericMessages.MONETIZATION_SWITCHED' } };
	}
});
