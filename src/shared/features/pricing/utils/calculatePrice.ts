/**
 * Pure pricing logic shared by the SvelteKit frontend (accommodation / checkout) and the Convex
 * backend (search projection). Single source of truth for nightly price + breakdown.
 *
 * Framework-free by contract: only plain TS + `import type` — no `$app`/`$env`/`$lib`,
 * no browser globals, no `.svelte`. That's what lets Convex bundle it. Keep it that way,
 * otherwise the next `convex deploy` breaks.
 */

// TYPES
import type {
	typesPricingInput,
	typesCalculatedPrice
} from '@/shared/features/pricing/types/types';

/** Nightly price actually charged (discounted price when one is set). */
export function effectiveNightlyPrice(acc: typesPricingInput): number {
	return acc.discountAmount && acc.discountAmount > 0 ? acc.discountAmount : acc.pricePerNight;
}

/** Single source of truth for the price breakdown shown on the accommodation and at checkout. */
export function calculatePrice(acc: typesPricingInput, nights: number): typesCalculatedPrice {
	const nightly = effectiveNightlyPrice(acc);
	const cleaningFee = acc.cleaningFee ?? 0;
	const accommodationTotal = nightly * nights;

	return {
		nightly,
		nights,
		accommodationTotal,
		cleaningFee,
		total: accommodationTotal + cleaningFee
	};
}
