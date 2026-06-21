// LIBRARIES
import { importGoogleLibrary } from './loader';

/**
 * Thin, dependency-free wrapper around the **Places API (New)** autocomplete.
 *
 * We don't render Google's own widget — instead we call
 * `AutocompleteSuggestion.fetchAutocompleteSuggestions()` and feed the results
 * into our own dropdown (so it matches the design system), then resolve the
 * selected prediction to a {@link PlaceDetails} via `place.fetchFields()`.
 *
 * The bootstrap script itself is loaded by `./loader` (shared with `maps.ts`).
 * Types come from `@types/google.maps` (the ambient `google.maps` namespace).
 */

/* -------------------------------------------------------------------------- */
/* Public shapes                                                               */
/* -------------------------------------------------------------------------- */

export type PlaceSuggestion = {
	placeId: string;
	primaryText: string;
	secondaryText: string;
};

export type PlaceDetails = {
	placeId: string;
	/** Full one-line address from Google. */
	formattedAddress: string;
	/** Street number + route only (falls back to the formatted address). */
	addressLine: string;
	city: string;
	country: string;
	lat: number | null;
	lng: number | null;
};

/* -------------------------------------------------------------------------- */
/* Loader — imports the places library (bootstrap handled by ./loader).         */
/* -------------------------------------------------------------------------- */

let libraryPromise: Promise<google.maps.PlacesLibrary> | null = null;

export function loadPlacesLibrary(): Promise<google.maps.PlacesLibrary> {
	if (libraryPromise) return libraryPromise;

	libraryPromise = importGoogleLibrary<google.maps.PlacesLibrary>('places');

	// Allow a retry if the network/script load failed.
	libraryPromise.catch(() => {
		libraryPromise = null;
	});

	return libraryPromise;
}

/* -------------------------------------------------------------------------- */
/* Session — groups keystrokes + the final selection into one billable session */
/* -------------------------------------------------------------------------- */

/**
 * Create an autocomplete session. Reuse the returned `search`/`select` pair for
 * the lifetime of one address lookup; the session token is rotated after each
 * successful selection (Google's billing best practice).
 */
export function createPlacesSession(options?: { regionCodes?: string[]; language?: string }) {
	let library: google.maps.PlacesLibrary | null = null;
	let token: google.maps.places.AutocompleteSessionToken | null = null;
	let predictions = new Map<string, google.maps.places.PlacePrediction>();

	async function ensureLibrary(): Promise<google.maps.PlacesLibrary> {
		if (!library) library = await loadPlacesLibrary();
		if (!token) token = new library.AutocompleteSessionToken();
		return library;
	}

	async function search(input: string): Promise<PlaceSuggestion[]> {
		const lib = await ensureLibrary();
		const { suggestions } = await lib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
			input,
			sessionToken: token!,
			includedRegionCodes: options?.regionCodes,
			language: options?.language
		});

		predictions = new Map();
		const out: PlaceSuggestion[] = [];
		for (const suggestion of suggestions) {
			const prediction = suggestion.placePrediction;
			if (!prediction) continue;
			predictions.set(prediction.placeId, prediction);
			out.push({
				placeId: prediction.placeId,
				primaryText: prediction.mainText?.text ?? prediction.text.text,
				secondaryText: prediction.secondaryText?.text ?? ''
			});
		}
		return out;
	}

	async function select(placeId: string): Promise<PlaceDetails | null> {
		const prediction = predictions.get(placeId);
		if (!prediction) return null;

		const place = prediction.toPlace();
		await place.fetchFields({ fields: ['id', 'formattedAddress', 'addressComponents', 'location'] });

		// Selection closes the session; next keystroke starts a fresh token.
		token = null;
		return toPlaceDetails(place);
	}

	return { search, select };
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function component(
	components: google.maps.places.AddressComponent[] | null | undefined,
	type: string
): string {
	return components?.find((c) => c.types.includes(type))?.longText ?? '';
}

function toPlaceDetails(place: google.maps.places.Place): PlaceDetails {
	const components = place.addressComponents;

	const streetNumber = component(components, 'street_number');
	const route = component(components, 'route');
	const addressLine = [streetNumber, route].filter(Boolean).join(' ').trim();

	const city =
		component(components, 'locality') ||
		component(components, 'postal_town') ||
		component(components, 'administrative_area_level_2') ||
		component(components, 'administrative_area_level_1');

	const formattedAddress = place.formattedAddress ?? '';

	return {
		placeId: place.id,
		formattedAddress,
		addressLine: addressLine || formattedAddress,
		city,
		country: component(components, 'country'),
		lat: place.location ? place.location.lat() : null,
		lng: place.location ? place.location.lng() : null
	};
}
