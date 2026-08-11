// UTILS
import { resolveMergedRegionPlaceId } from '@/lib/google-maps/places';
import { toLatin } from '@/utils/cyrillicToLatin';

// TYPES
import type { PlaceDetails } from '@/lib/google-maps/places';
import type { typesAddAccommodationForm } from '@/shared/features/accommodation/types/accommodationTypes';

/** Location fields the autocompletes fill directly on the `$state` form proxy. The required
 *  `placeId` gate is set separately through the form's `setValue`, so it clears its own error. */
type AccommodationLocationValues = Pick<
	typesAddAccommodationForm,
	'address' | 'addressNumber' | 'city' | 'country' | 'timeZone' | 'coordinates'
>;

/**
 * Apply a picked **Country/City** region to the form.
 *
 * Fills `city`/`country` and resolves the accommodation's merged city+country `placeId` (the required
 * gate, set through `setPlaceId` so its validation error clears — the place's own id first so the
 * gate passes immediately, then the resolved region id once the lookups return). Any street picked
 * for the *previous* region is cleared, since it no longer belongs here.
 */
export async function applyRegionToValues(
	target: AccommodationLocationValues,
	place: PlaceDetails,
	setPlaceId: (value: string) => void
): Promise<void> {
	// toLatin guard (TODO.md §2 layer 3): whatever a picked place carries is stored Latin.
	// With the `language: 'en'` bootstrap this is a no-op on the happy path — it catches any
	// bypassed layer (e.g. a Cyrillic formatted-address fallback) at the storage boundary.
	target.city = toLatin(place.city);
	target.country = toLatin(place.country);

	// Region changed — the previously selected street/number/pin no longer apply.
	target.address = '';
	target.addressNumber = '';
	target.coordinates = undefined;
	target.timeZone = '';

	setPlaceId(place.placeId);
	setPlaceId(await resolveMergedRegionPlaceId(place));
}

/**
 * Apply a picked **street** (within the chosen region) to the form: the street name, the map pin
 * and the timezone resolved from that pin. If the picked place carries a street number (the host
 * searched e.g. "Francuska 10"), it pre-fills the separate number field too; otherwise the number
 * is left as-is for manual entry.
 */
export function applyStreetToValues(
	target: AccommodationLocationValues,
	place: PlaceDetails,
	setStreet: (value: string) => void
): void {
	setStreet(toLatin(place.street || place.addressLine));
	if (place.streetNumber) target.addressNumber = toLatin(place.streetNumber);
	target.coordinates =
		place.lat !== null && place.lng !== null ? { lat: place.lat, lng: place.lng } : undefined;
	target.timeZone = place.timeZone ?? '';
}
