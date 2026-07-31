/**
 * Pricing feature types. Framework-free (no runtime imports) so the Convex runtime can
 * bundle the utils that consume them.
 */

/** Minimal price-bearing fields needed to compute a stay's price. */
export type typesPricingInput = {
	pricePerNight: number;
	discountAmount?: number;
	cleaningFee?: number;
	/** The listing's model (ASD §8) — the fee applies only on `booking_fee` listings. */
	monetization?: 'listing_fee' | 'booking_fee';
};

/** Resolved price breakdown for a stay of `nights` nights. */
export type typesCalculatedPrice = {
	nightly: number;
	nights: number;
	accommodationTotal: number;
	cleaningFee: number;
	/**
	 * Platform cut, derived from `ACCOMMODATIONS_CONFIG.MONETIZATION` at call time — 0 in
	 * every mode but `booking_fee`. Included in {@link typesCalculatedPrice.total} so the
	 * guest sees it before committing, never first on the receipt.
	 */
	platformFee: number;
	total: number;
};
