/**
 * Pricing feature types. Framework-free (no runtime imports) so the Convex runtime can
 * bundle the utils that consume them.
 */

/** Minimal price-bearing fields needed to compute a stay's price. */
export type typesPricingInput = {
	pricePerNight: number;
	discountAmount?: number;
	cleaningFee?: number;
};

/** Resolved price breakdown for a stay of `nights` nights. */
export type typesCalculatedPrice = {
	nightly: number;
	nights: number;
	accommodationTotal: number;
	cleaningFee: number;
	total: number;
};
