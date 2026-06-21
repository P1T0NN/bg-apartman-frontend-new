// nuqs URL state + filter helpers shared by the search page panes (list, map, filters).
import { useQueryStates, parseAsString } from 'nuqs-svelte';

import type { FilterKey, SearchState } from './types';

// Every filter defaults to 'any', which nuqs strips from the URL — so a clean
// `?location=Belgrade` stays clean until a real filter is chosen.
const keymap = {
	location: parseAsString.withDefault(''),
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

/** Minimum-match: 'any' passes everything; '4+' / '2' mean ">= that number". */
export function atLeast(value: number, filter: string): boolean {
	if (filter === 'any') return true;
	const min = Number.parseInt(filter, 10); // '4+' -> 4
	return Number.isNaN(min) || value >= min;
}

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
