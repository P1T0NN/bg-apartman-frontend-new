/**
 * Pure pricing logic shared by the SvelteKit frontend (accommodation / checkout) and the Convex
 * backend (search projection). Single source of truth for nightly price + breakdown.
 *
 * Framework-free by contract: only plain TS + `import type` — no `$app`/`$env`/`$lib`,
 * no browser globals, no `.svelte`. That's what lets Convex bundle it. Keep it that way,
 * otherwise the next `convex deploy` breaks.
 */

// CONFIG
import { ACCOMMODATIONS_CONFIG } from '@/shared/config';

// UTILS
import { nightsBetween, shiftIsoDate } from '@/shared/utils/dateUtils';

// TYPES
import type {
	typesPricingInput,
	typesCalculatedPrice
} from '@/shared/features/pricing/types/types';

/** Nightly price actually charged on a non-weekend night (discounted price when one is set). */
export function effectiveNightlyPrice(acc: typesPricingInput): number {
	return acc.discountAmount && acc.discountAmount > 0 ? acc.discountAmount : acc.pricePerNight;
}

/**
 * The platform's cut of a stay — nonzero only when monetization is on AND this listing is
 * on the per-booking-fee model (AccommodationsSystemDesign.md §8, revised 2026-07-31: the
 * model is a per-listing host choice, not a global mode).
 *
 * Existing bookings are unaffected: they carry their own `platformFee` in the price
 * snapshot, so a config change or a model switch can never reprice history.
 */
export function platformFeeFor(
	subtotal: number,
	monetization?: 'listing_fee' | 'booking_fee'
): number {
	if (ACCOMMODATIONS_CONFIG.MONETIZATION !== 'per_listing') return 0;
	if (monetization !== 'booking_fee') return 0;

	const { PERCENT, MIN_EUROS } = ACCOMMODATIONS_CONFIG.BOOKING_FEE;
	return Math.max(Math.round((subtotal * PERCENT) / 100), MIN_EUROS);
}

/** Night starting on Friday (5) or Saturday (6), charged `weekendPremium` instead of the base. */
function isWeekendNight(isoDate: string): boolean {
	const dow = new Date(`${isoDate}T00:00:00Z`).getUTCDay();
	return dow === 5 || dow === 6;
}

/**
 * Single source of truth for the price breakdown shown on the accommodation and at checkout.
 *
 * Pipeline (AccommodationsSystemDesign.md §5): which nightly rate applies PER NIGHT (a
 * `weekendPremium` Fri/Sat override when the night owns one), then the stay-length discount
 * (`weeklyDiscount` percent off at 7+ nights), then the cleaning fee, then `platformFee` when
 * §8 says so. `nightly * nights` alone silently misses every one of these — the composer
 * takes the stay's dates so it, not the caller, decides.
 */
export function calculatePrice(
	acc: typesPricingInput,
	checkInDate?: string | null,
	checkOutDate?: string | null
): typesCalculatedPrice {
	const nights = nightsBetween(checkInDate, checkOutDate);
	const nightly = effectiveNightlyPrice(acc);
	const weekendPremium =
		acc.weekendPremium && acc.weekendPremium > 0 ? acc.weekendPremium : undefined;
	const cleaningFee = acc.cleaningFee ?? 0;

	// Per-night subtotal with the weekend override applied to exactly the nights it owns.
	let weekendNights = 0;
	let subtotal = 0;
	if (checkInDate) {
		for (let i = 0; i < nights; i++) {
			const weekend = weekendPremium !== undefined && isWeekendNight(shiftIsoDate(checkInDate, i));
			if (weekend) weekendNights++;
			subtotal += weekend ? weekendPremium : nightly;
		}
	}

	// Stay-length discount — percent off the nights total for stays of 7+ nights.
	const lengthDiscountPercent =
		nights >= 7 && acc.weeklyDiscount && acc.weeklyDiscount > 0 ? acc.weeklyDiscount : 0;
	const lengthDiscount = Math.round((subtotal * lengthDiscountPercent) / 100);
	const accommodationTotal = subtotal - lengthDiscount;

	const platformFee = platformFeeFor(accommodationTotal, acc.monetization);

	return {
		nightly,
		nights,
		weekendNights,
		...(weekendNights > 0 && { weekendPremium }),
		lengthDiscountPercent,
		lengthDiscount,
		accommodationTotal,
		cleaningFee,
		platformFee,
		total: accommodationTotal + cleaningFee + platformFee
	};
}
