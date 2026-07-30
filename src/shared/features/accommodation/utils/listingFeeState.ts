// CONFIG
import { ACCOMMODATIONS_CONFIG, MS_PER_DAY } from '@/shared/config';

// TYPES
import type { typesAccommodationFeeState } from '@/shared/features/accommodation/types/accommodationTypes';

/**
 * Is the platform currently charging hosts to stay listed?
 *
 * Every listing-fee surface — the cron, the renewal mutations, the `my-accommodations`
 * column — branches on THIS, never on field presence: legacy rows carry `paidAt` and
 * `apartmentSubscriptionExpiryDate` from the old bank integration even in `'none'` mode,
 * and showing them a billing UI would be a lie (AccommodationsSystemDesign.md §8's
 * "reads branch on the mode constant", § FOR LLMs 4).
 */
export const listingFeeModeActive = (): boolean =>
	ACCOMMODATIONS_CONFIG.MONETIZATION === 'listing_fee';

/**
 * One reading of a listing's fee position, shared by the sweep and the host row so the
 * cron's decision and the host's on-screen state can never disagree.
 *
 * `daysLeft` is signed and rounded toward the host's reading of a calendar: 0 means
 * "expires today", −2 means "two days overdue".
 */
export function listingFeeState(
	apartment: { apartmentSubscriptionExpiryDate?: number },
	now = Date.now()
): typesAccommodationFeeState {
	const expiresAt = apartment.apartmentSubscriptionExpiryDate;
	if (!listingFeeModeActive() || expiresAt === undefined) return { kind: 'inactive' };

	const { GRACE_DAYS, REMINDER_DAYS_BEFORE } = ACCOMMODATIONS_CONFIG.LISTING_FEE;
	const daysLeft = Math.ceil((expiresAt - now) / MS_PER_DAY);

	if (daysLeft < -GRACE_DAYS) return { kind: 'lapsed', expiresAt, daysLeft };
	if (daysLeft < 0) return { kind: 'grace', expiresAt, daysLeft };
	if (daysLeft <= REMINDER_DAYS_BEFORE) return { kind: 'expiring', expiresAt, daysLeft };
	return { kind: 'active', expiresAt, daysLeft };
}
