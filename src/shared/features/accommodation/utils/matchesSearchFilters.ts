// TYPES
import type { SearchCountFilters, SearchFilterableAccommodation } from '../types/accommodationTypes';

/**
 * Does this listing satisfy the caller's `/search` filters — everything decidable without
 * touching another table?
 *
 * Pure and structurally typed (not `Doc<'apartments'>`) so the rule that decides what a searcher
 * sees can be asserted directly — see `matchesSearchFilters.check.ts`. The remaining filter, date
 * availability, is a join and lives in `searchAccommodationsStream`, which applies this first: a
 * row rejected here must never pay for two more index reads.
 *
 * The count filters are MINIMUMS ("2+ bedrooms"), which is what the UI's `4+` option means and
 * what `parseCount` produces. Coordinates and at least one photo are hard requirements rather
 * than filters: without them there is no pin to place and no card to draw.
 */
export function matchesSearchFilters(
	accommodation: SearchFilterableAccommodation,
	filters: SearchCountFilters
): boolean {
	if (accommodation.coordinates === undefined) return false;
	if (accommodation.images.length === 0) return false;

	if (filters.bedrooms !== undefined && accommodation.bedrooms < filters.bedrooms) return false;
	if (filters.bathrooms !== undefined && accommodation.bathrooms < filters.bathrooms) return false;
	if (filters.guests !== undefined && accommodation.maxGuests < filters.guests) return false;

	return true;
}
