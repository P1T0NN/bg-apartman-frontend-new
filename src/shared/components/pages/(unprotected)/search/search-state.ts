// nuqs URL state + filter helpers shared by the search page panes (list, map, filters).
import { useQueryStates, parseAsString } from 'nuqs-svelte';

import type { FilterKey, SearchState } from './types';

// Every filter defaults to 'any', which nuqs strips from the URL — so a clean
// `?location=Belgrade` stays clean until a real filter is chosen.
const keymap = {
	location: parseAsString.withDefault(''),
	// Google place id of the picked region (a city or a country). Search keeps listings whose
	// merged city+country `placeId` contains it. Set only when a place is selected.
	placeId: parseAsString.withDefault(''),
	checkIn: parseAsString,
	checkOut: parseAsString,
	bedrooms: parseAsString.withDefault('any'),
	bathrooms: parseAsString.withDefault('any'),
	guests: parseAsString.withDefault('any')
};

export function useSearchState() {
	return useQueryStates(keymap);
}

// The count filters. `noun` is what an active chip reads ("4+ baths").
export const FILTER_DEFS = [
	{ key: 'bedrooms', label: 'Bedrooms', noun: 'bedrooms' },
	{ key: 'bathrooms', label: 'Bathrooms', noun: 'baths' },
	{ key: 'guests', label: 'Guests', noun: 'guests' }
] as const;

export const FILTER_OPTIONS = ['any', '1', '2', '3', '4+'] as const;

/** Parse a count filter for the query: 'any'/'' → undefined, '4+' → 4, '2' → 2. */
export function parseCount(filter: string | null | undefined): number | undefined {
	if (!filter || filter === 'any') return undefined;
	const min = Number.parseInt(filter, 10); // '4+' -> 4
	return Number.isNaN(min) ? undefined : min;
}

/**
 * Everything a search needs, decoded from the URL — the shape the Convex query accepts. It keeps
 * listings whose merged `placeId` contains the picked region's `placeId`, plus the count minimums,
 * and (later) drops apartments with a booking overlapping [checkIn, checkOut). `location` is the
 * display label only.
 */
export type AccommodationSearchParams = {
	placeId?: string;
	location?: string;
	checkIn?: string;
	checkOut?: string;
	bedrooms?: number;
	bathrooms?: number;
	guests?: number;
};

/** Active (non-'any') filters as removable chips. Read inside a $derived to stay reactive. */
export function activeFilters(search: SearchState) {
	return FILTER_DEFS.map((d) => ({
		key: d.key,
		label: `${search[d.key].current} ${d.noun}`,
		value: search[d.key].current
	})).filter((c) => c.value !== 'any');
}

/**
 * Write a filter (null clears it back to default and drops it from the URL). Goes through
 * `search.set` rather than `search[key].current =`, whose per-slice setter is mistyped in
 * nuqs-svelte (it can't accept null); dispatched per key so the update object stays typed.
 */
export function setFilter(search: SearchState, key: FilterKey, value: string | null) {
	switch (key) {
		case 'bedrooms':
			search.set({ bedrooms: value });
			break;
		case 'bathrooms':
			search.set({ bathrooms: value });
			break;
		case 'guests':
			search.set({ guests: value });
			break;
	}
}

export function removeFilter(search: SearchState, key: FilterKey) {
	setFilter(search, key, null);
}

export function clearFilters(search: SearchState) {
	for (const d of FILTER_DEFS) setFilter(search, d.key, null);
}
