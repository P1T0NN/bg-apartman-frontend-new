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

/** Bounding box of a place — fed back as a follow-up search's `locationRestriction`. */
export type RegionBounds = google.maps.LatLngBoundsLiteral;

export type PlaceDetails = {
	placeId: string;
	/** Full one-line address from Google. */
	formattedAddress: string;
	/** Street number + route only (falls back to the formatted address). */
	addressLine: string;
	/** Route (street) name only, without the number — for a dedicated "street name" field. */
	street: string;
	/** Street number, when the picked place includes one (e.g. "10" from "Francuska 10"). `''` otherwise. */
	streetNumber: string;
	city: string;
	country: string;
	lat: number | null;
	lng: number | null;
	/** Viewport bounds of the place (a city's or country's bbox), used to scope a
	 *  follow-up street search to this region. `null` when Google didn't return one. */
	viewport: RegionBounds | null;
	/** IANA zone of the pin (e.g. `'Europe/Belgrade'`), resolved from lat/lng when the
	 *  session opts in via `resolveTimeZone`. `null` when not requested or unresolvable. */
	timeZone: string | null;
};

/**
 * Primary types the search box offers — only cities and countries. Kept in lockstep with
 * {@link resolveMergedRegionPlaceId} (which resolves a listing's city as a `locality` and its
 * country as a `country`), so the place id the box yields equals the id stored on the listing.
 */
export const REGION_PRIMARY_TYPES = ['locality', 'country'] as const;

/**
 * Cities-only filter for the listing's location search. `(cities)` is Google's type collection for
 * city-level results (localities + smaller admin areas), so countries never appear on their own —
 * the host picks a city and we derive the country from it. Suggestions still show the country as
 * secondary text. The merged listing key is still resolved per {@link resolveMergedRegionPlaceId}.
 */
export const CITY_PRIMARY_TYPES = ['(cities)'] as const;

/** Human-readable label for a region-style place (city, state/province, or country). */
export function formatRegionLabel(
	details: Pick<PlaceDetails, 'city' | 'country' | 'formattedAddress'>
) {
	const { city, country } = details;
	if (city && country && city !== country) return `${city}, ${country}`;
	return city || country || details.formattedAddress;
}

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
/* Region place-id resolution — same API the search box uses (ids stay aligned) */
/* -------------------------------------------------------------------------- */

/**
 * Top place id for a region NAME, via Places Autocomplete restricted to one primary type.
 *
 * Used to turn the selected address's city/country *names* into the *same* place ids the search
 * box produces — because place ids are canonical per place and language-independent, resolving
 * "Beograd" here yields the identical id the box yields for "Belgrade". Returns `null` when the
 * name resolves to nothing or the lookup fails.
 */
export async function resolveRegionPlaceId(
	input: string,
	type: 'locality' | 'country'
): Promise<string | null> {
	if (!input.trim()) return null;
	try {
		const lib = await loadPlacesLibrary();
		const { suggestions } = await lib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
			input,
			includedPrimaryTypes: [type]
		});
		for (const suggestion of suggestions) {
			if (suggestion.placePrediction) return suggestion.placePrediction.placeId;
		}
		return null;
	} catch (error) {
		console.error('[places] region place-id resolution failed:', error);
		return null;
	}
}

/**
 * The listing's location key: its city + country place ids joined with a space (e.g.
 * `"<cityId> <countryId>"`). Resolved through {@link resolveRegionPlaceId} so both ids match the
 * search box, letting one listing surface for a city search *and* a country search, in either
 * language. Falls back to the place's own id when neither region resolves (so the field is never
 * empty and the form can still submit).
 */
export async function resolveMergedRegionPlaceId(place: PlaceDetails): Promise<string> {
	const [cityId, countryId] = await Promise.all([
		resolveRegionPlaceId(place.city, 'locality'),
		resolveRegionPlaceId(place.country, 'country')
	]);
	const merged = [cityId, countryId].filter(Boolean).join(' ');
	return merged || place.placeId;
}

/* -------------------------------------------------------------------------- */
/* Session — groups keystrokes + the final selection into one billable session */
/* -------------------------------------------------------------------------- */

/**
 * Create an autocomplete session. Reuse the returned `search`/`select` pair for
 * the lifetime of one address lookup; the session token is rotated after each
 * successful selection (Google's billing best practice).
 */
export function createPlacesSession(options?: {
	regionCodes?: string[];
	language?: string;
	includedPrimaryTypes?: readonly string[];
	/** Resolve the selected place's IANA timezone from its coordinates (off by default —
	 *  only the address variant needs it; loads `tz-lookup` lazily on first selection). */
	resolveTimeZone?: boolean;
}) {
	let library: google.maps.PlacesLibrary | null = null;
	let token: google.maps.places.AutocompleteSessionToken | null = null;
	let predictions = new Map<string, google.maps.places.PlacePrediction>();

	async function ensureLibrary(): Promise<google.maps.PlacesLibrary> {
		if (!library) library = await loadPlacesLibrary();
		if (!token) token = new library.AutocompleteSessionToken();
		return library;
	}

	async function search(
		input: string,
		// Per-call so it can change between keystrokes (e.g. once a region is picked, the
		// street search is restricted to that region's bbox). Not a session option.
		perCall?: { locationRestriction?: RegionBounds }
	): Promise<PlaceSuggestion[]> {
		const lib = await ensureLibrary();
		const { suggestions } = await lib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
			input,
			sessionToken: token!,
			includedRegionCodes: options?.regionCodes,
			// Google wants a mutable string[]; our option is readonly (allows `as const`).
			includedPrimaryTypes: options?.includedPrimaryTypes
				? [...options.includedPrimaryTypes]
				: undefined,
			locationRestriction: perCall?.locationRestriction,
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
		await place.fetchFields({
			fields: ['id', 'formattedAddress', 'addressComponents', 'location', 'viewport']
		});

		// Selection closes the session; next keystroke starts a fresh token.
		token = null;

		const details = toPlaceDetails(place);
		if (options?.resolveTimeZone && details.lat !== null && details.lng !== null) {
			details.timeZone = await lookupTimeZone(details.lat, details.lng);
		}
		return details;
	}

	return { search, select };
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Coordinates → IANA timezone name. `tz-lookup` is imported lazily so guests never
 * download it; returns `null` on failure so the caller falls back to a default zone.
 */
async function lookupTimeZone(lat: number, lng: number): Promise<string | null> {
	try {
		const { default: tzlookup } = await import('tz-lookup');
		return tzlookup(lat, lng);
	} catch (error) {
		console.error('[places-autocomplete] timezone lookup failed:', error);
		return null;
	}
}

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
		street: route,
		streetNumber,
		city,
		country: component(components, 'country'),
		lat: place.location ? place.location.lat() : null,
		lng: place.location ? place.location.lng() : null,
		viewport: place.viewport ? place.viewport.toJSON() : null,
		// Resolved by `select()` after the fact (needs an async lookup); null here.
		timeZone: null
	};
}
