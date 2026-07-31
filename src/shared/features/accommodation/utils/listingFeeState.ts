// CONFIG
import { ACCOMMODATIONS_CONFIG, MS_PER_DAY } from '@/shared/config';

// TYPES
import type { typesAccommodationFeeState } from '@/shared/features/accommodation/types/accommodationTypes';

/** A listing's monetization fields — the slice every fee read needs. */
type ListingMonetizationSlice = {
	monetization?: 'listing_fee' | 'booking_fee';
	apartmentSubscriptionExpiryDate?: number;
};

/**
 * Does monetization exist at all on this platform right now?
 *
 * Every fee surface — the cron, the renewal mutations, the `my-accommodations` column,
 * the create-wizard plan step — branches on THIS first, then on the LISTING's
 * `monetization` field, never on payment-stamp presence: legacy rows carry `paidAt` and
 * `apartmentSubscriptionExpiryDate` from the old bank integration even in `'none'` mode,
 * and showing them a billing UI would be a lie (AccommodationsSystemDesign.md §8,
 * § FOR LLMs 4).
 */
export const monetizationActive = (): boolean =>
	ACCOMMODATIONS_CONFIG.MONETIZATION === 'per_listing';

/** Is THIS listing on the pay-to-be-listed model (and monetization on at all)? */
export const listingIsListingFee = (listing: ListingMonetizationSlice): boolean =>
	monetizationActive() && listing.monetization === 'listing_fee';

/** Is THIS listing on the per-booking-fee model (and monetization on at all)? */
export const listingIsBookingFee = (listing: ListingMonetizationSlice): boolean =>
	monetizationActive() && listing.monetization === 'booking_fee';

/**
 * One reading of a listing's fee position, shared by the sweep, the publish gate and the
 * host row so the cron's decision, the moderation refusal and the host's on-screen state
 * can never disagree.
 *
 * `unpaid` = a `listing_fee` listing that has never had a period — the state that gates
 * publish (ASD §8 "the first period gates going live"). The sweep leaves it alone: there
 * is no live period to defend.
 *
 * `daysLeft` is signed and rounded toward the host's reading of a calendar: 0 means
 * "expires today", −2 means "two days overdue".
 */
export function listingFeeState(
	apartment: ListingMonetizationSlice,
	now = Date.now()
): typesAccommodationFeeState {
	if (!listingIsListingFee(apartment)) return { kind: 'inactive' };

	const expiresAt = apartment.apartmentSubscriptionExpiryDate;
	if (expiresAt === undefined) return { kind: 'unpaid' };

	const { GRACE_DAYS, REMINDER_DAYS_BEFORE } = ACCOMMODATIONS_CONFIG.LISTING_FEE;
	const daysLeft = Math.ceil((expiresAt - now) / MS_PER_DAY);

	if (daysLeft < -GRACE_DAYS) return { kind: 'lapsed', expiresAt, daysLeft };
	if (daysLeft < 0) return { kind: 'grace', expiresAt, daysLeft };
	if (daysLeft <= REMINDER_DAYS_BEFORE) return { kind: 'expiring', expiresAt, daysLeft };
	return { kind: 'active', expiresAt, daysLeft };
}
