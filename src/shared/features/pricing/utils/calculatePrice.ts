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

// TYPES
import type {
	typesPricingInput,
	typesCalculatedPrice
} from '@/shared/features/pricing/types/types';

/** Nightly price actually charged (discounted price when one is set). */
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

/** Single source of truth for the price breakdown shown on the accommodation and at checkout. */
export function calculatePrice(acc: typesPricingInput, nights: number): typesCalculatedPrice {
	const nightly = effectiveNightlyPrice(acc);
	const cleaningFee = acc.cleaningFee ?? 0;
	const accommodationTotal = nightly * nights;
	const platformFee = platformFeeFor(accommodationTotal, acc.monetization);

	return {
		nightly,
		nights,
		accommodationTotal,
		cleaningFee,
		platformFee,
		total: accommodationTotal + cleaningFee + platformFee
	};
}
