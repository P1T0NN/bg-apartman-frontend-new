/**
 * Pricing feature types. Framework-free (no runtime imports) so the Convex runtime can
 * bundle the utils that consume them.
 */

/** Minimal price-bearing fields needed to compute a stay's price. */
export type typesPricingInput = {
	pricePerNight: number;
	discountAmount?: number;
	cleaningFee?: number;
	/** Fri/Sat nightly override (ASD §5) — nights starting on Friday or Saturday charge this. */
	weekendPremium?: number;
	/** Percent off the nights total for a 7+ night stay (e.g. 10 = 10% off). */
	weeklyDiscount?: number;
	/** The listing's model (ASD §8) — the fee applies only on `booking_fee` listings. */
	monetization?: 'listing_fee' | 'booking_fee';
};

/** Resolved price breakdown for a stay of `nights` nights. */
export type typesCalculatedPrice = {
	nightly: number;
	nights: number;
	/** Nights starting on Friday/Saturday, which charged `weekendPremium` (0 = none). */
	weekendNights: number;
	/** The weekend override actually applied — present only when `weekendNights` > 0. */
	weekendPremium?: number;
	/** Applied stay-length percent — 0 when the stay is under 7 nights. */
	lengthDiscountPercent: number;
	/** Whole-euro amount the stay-length discount removes from the nights total. */
	lengthDiscount: number;
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
