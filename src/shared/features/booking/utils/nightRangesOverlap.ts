/**
 * Do two night ranges share at least one night?
 *
 * Ranges are **half-open** — `[start, end)` — so a stay ending on X never overlaps one
 * starting on X, which is what makes same-day turnover (checkout morning → check-in
 * afternoon) legal. ISO `YYYY-MM-DD` strings compare lexicographically, so plain string
 * comparison is a correct date comparison.
 *
 * The single night-convention for the whole platform: bookings AND host calendar blocks
 * both go through here, so a block can never disagree with a booking about which nights
 * it covers.
 */
export function nightRangesOverlap(
	aStart: string,
	aEnd: string,
	bStart: string,
	bEnd: string
): boolean {
	return aStart < bEnd && bStart < aEnd;
}
