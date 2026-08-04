/**
 * Split a listing's merged region key into its indexable halves.
 *
 * `placeId` is stored as `"<cityId> <countryId>"` — resolved once at save from Google Places,
 * so the ids are language-independent: "Beograd" and "Belgrade" are the same city id, "Srbija"
 * and "Serbia" the same country id. That is the whole reason the ids exist rather than storing
 * city/country names, and why search must never match on the text.
 *
 * The merged form made search UNINDEXABLE, though: matching it meant `.split(' ').includes(x)`
 * in memory, which forced the query to read a truncated sample of the table and filter after —
 * so a listing outside that sample was invisible no matter what you searched. Storing the two
 * halves as their own columns turns a city search into an exact index range.
 *
 * Semantics preserved exactly from the old in-memory test:
 *   - `"cityId countryId"` → each half indexed under its own column;
 *   - a single unsplit id (the `resolveMergedRegionPlaceId` fallback, when neither region
 *     resolved) is ambiguous — it lands in BOTH columns, so it still matches whether the
 *     searcher picked it as a city or as a country, exactly as `includes()` did;
 *   - empty/absent → both `undefined`, and the row simply never matches a region search.
 */
export function splitRegionPlaceId(mergedPlaceId: string | undefined): {
	cityPlaceId: string | undefined;
	countryPlaceId: string | undefined;
} {
	const parts = mergedPlaceId?.trim().split(/\s+/).filter(Boolean) ?? [];

	if (parts.length === 0) return { cityPlaceId: undefined, countryPlaceId: undefined };
	if (parts.length === 1) return { cityPlaceId: parts[0], countryPlaceId: parts[0] };

	return { cityPlaceId: parts[0], countryPlaceId: parts[1] };
}
