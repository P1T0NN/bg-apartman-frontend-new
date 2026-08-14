// LIBRARIES
import { importGoogleLibrary } from './loader';
import { toLatin } from '../../utils/cyrillicToLatin';

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
	/** Route (street) name only, without the number — for a dedicated "street name" field. */
	street: string;
	/** Street number, when the picked place includes one (e.g. "10" from "Francuska 10"). `''` otherwise. */
	streetNumber: string;
	city: string;
	country: string;
	/** ISO 3166-1 alpha-2 of the place's country (e.g. "RS", "ME") — biases every follow-up
	 *  region lookup so homonyms can't cross countries ("Bar" → Barajevo/Barcelona). */
	countryCode: string;
	lat: number | null;
	lng: number | null;
	/** IANA zone of the pin (e.g. `'Europe/Belgrade'`), resolved from lat/lng when the
	 *  session opts in via `resolveTimeZone`. `null` when not requested or unresolvable. */
	timeZone: string | null;
};

/**
 * Primary types the search box offers — only cities and countries. Kept in lockstep with
 * {@link resolveMergedRegionPlaceId} (which resolves an accommodation's city as a `locality` and its
 * country as a `country`), so the place id the box yields equals the id stored on the accommodation.
 */
export const REGION_PRIMARY_TYPES = ['locality', 'country'] as const;

/**
 * Cities-only filter for the accommodation's location search. `(cities)` is Google's type collection for
 * city-level results (localities + smaller admin areas), so countries never appear on their own —
 * the host picks a city and we derive the country from it. Suggestions still show the country as
 * secondary text. The merged accommodation key is still resolved per {@link resolveMergedRegionPlaceId}.
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
	type: 'locality' | 'country',
	// Bias to one country so a homonym can't win ("Bar" → Barajevo/Barcelona without it).
	regionCodes?: string[]
): Promise<string | null> {
	if (!input.trim()) return null;
	try {
		const lib = await loadPlacesLibrary();
		const { suggestions } = await lib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
			input,
			includedRegionCodes: regionCodes,
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
 * The accommodation's location key: its city + country place ids joined with a space (e.g.
 * `"<cityId> <countryId>"`). Resolved through {@link resolveRegionPlaceId} so both ids match the
 * search box, letting one accommodation surface for a city search *and* a country search, in either
 * language. Falls back to the place's own id when neither region resolves (so the field is never
 * empty and the form can still submit).
 */
export async function resolveMergedRegionPlaceId(place: PlaceDetails): Promise<string> {
	const [cityId, countryId] = await Promise.all([
		resolveRegionPlaceId(
			place.city,
			'locality',
			place.countryCode ? [place.countryCode] : undefined
		),
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

	async function search(input: string): Promise<PlaceSuggestion[]> {
		const lib = await ensureLibrary();
		const { suggestions } = await lib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
			input,
			sessionToken: token!,
			includedRegionCodes: options?.regionCodes,
			// Google wants a mutable string[]; our option is readonly (allows `as const`).
			includedPrimaryTypes: options?.includedPrimaryTypes
				? [...options.includedPrimaryTypes]
				: undefined,
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
			fields: ['id', 'formattedAddress', 'addressComponents', 'location']
		});

		// Selection closes the session; next keystroke starts a fresh token.
		token = null;

		const details = await toPlaceDetails(place);
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

// Municipality names that must never be stored as `city` (the geocoder + audit carry the same
// list). Google's data itself labels Belgrade's municipalities as `locality` ("Савски Венац")
// and Montenegro's municipalities as admin_level_1 ("Opština Bar") — both pose as localities.
const MUNICIPALITY_RE = /\b(Venac|Opština|Opstina|Grad|Naselje|Settlement)\b|-/i;

/**
 * Tail case of the city ladder (TODO.md §3): a place with **no** locality-level component at
 * all — only a sublocality / neighborhood (e.g. a pin dropped in "Savski Venac"). Such a
 * sublocality is never stored as `city`; instead the parent region (admin_level_1 or 2) is
 * resolved to its real locality through the search-box API. `''` when nothing resolves —
 * the form flags the row rather than ever storing a sublocality as the city.
 */
async function resolveParentLocalityName(
	components: google.maps.places.AddressComponent[] | null | undefined,
	// ISO alpha-2 of the pin's country — without it "Bar" autocompletes to Barcelona, Spain.
	countryCode: string
): Promise<string> {
	const parent =
		component(components, 'administrative_area_level_1') ||
		component(components, 'administrative_area_level_2') ||
		component(components, 'postal_town');
	if (!parent) return '';
	// "Opština Bar" would autocomplete to Barajevo (a homonym) — strip the prefix so the
	// resolution targets the town itself, then bias to the pin's country so the stripped
	// "Bar" lands on Bar, Montenegro rather than Barcelona, Spain. (Mirror of the geocoder's
	// server-side step.)
	const clean = parent.replace(/^(Opština|Opstina)\s+/i, '');
	try {
		const lib = await loadPlacesLibrary();
		const { suggestions } = await lib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
			input: clean,
			includedRegionCodes: countryCode ? [countryCode] : undefined,
			includedPrimaryTypes: ['locality']
		});
		// First suggestion is Google's most prominent locality for the parent name — the same
		// source `resolveRegionPlaceId` uses, plus the display name we need to store.
		return suggestions[0]?.placePrediction?.mainText?.text ?? '';
	} catch (error) {
		console.error('[places] parent locality resolution failed:', error);
		return '';
	}
}

async function toPlaceDetails(place: google.maps.places.Place): Promise<PlaceDetails> {
	const components = place.addressComponents;

	const streetNumber = component(components, 'street_number');
	const route = component(components, 'route');
	const addressLine = [streetNumber, route].filter(Boolean).join(' ').trim();

	// Resolution order (TODO.md §3): locality → postal_town → admin_level_2 → admin_level_1.
	// `sublocality` / `neighborhood` / `postal_code` are NEVER candidates.
	let city =
		component(components, 'locality') ||
		component(components, 'postal_town') ||
		component(components, 'administrative_area_level_2') ||
		component(components, 'administrative_area_level_1');

	// Municipalities posing as localities: drop them and resolve the parent instead. Two
	// signals — the name itself (Venac/Opština/Grad/…) or a DISTINCT political-typed
	// component carrying the same name as the city (Google puts Belgrade's municipality in a
	// separate `political` component while ALSO labeling it `locality`). The locality
	// component itself is typed ["locality","political"], so only a political component that
	// is NOT the locality/postal_town itself counts as a signal.
	const municipality =
		components?.find(
			(c) =>
				c.types.includes('political') &&
				!c.types.includes('locality') &&
				!c.types.includes('postal_town')
		)?.longText ?? '';
	// Compare latinized names: Google mixes scripts (locality "Савски Венац" + political
	// "Savski Venac") so a raw comparison misses the match.
	if (
		city &&
		(MUNICIPALITY_RE.test(toLatin(city)) ||
			toLatin(city).toLowerCase() === toLatin(municipality).toLowerCase())
	)
		city = '';

	const country = component(components, 'country');
	const countryCode = components?.find((c) => c.types.includes('country'))?.shortText ?? '';

	// Tail: no real locality → resolve the parent region's real locality (never a sublocality).
	if (!city) city = await resolveParentLocalityName(components, countryCode);

	const formattedAddress = place.formattedAddress ?? '';

	return {
		placeId: place.id,
		formattedAddress,
		addressLine: addressLine || formattedAddress,
		street: route,
		streetNumber,
		city,
		country,
		countryCode,
		lat: place.location ? place.location.lat() : null,
		lng: place.location ? place.location.lng() : null,
		// Resolved by `select()` after the fact (needs an async lookup); null here.
		timeZone: null
	};
}
