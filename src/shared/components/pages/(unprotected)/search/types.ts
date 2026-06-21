// Shared types for the search page panes, derived from the runtime state in search-state.ts.
import { activeFilters, FILTER_DEFS, useSearchState } from './search-state';

/** Reactive nuqs state object backing the search query (location + filters). */
export type SearchState = ReturnType<typeof useSearchState>;

/** The numeric count filters: 'bedrooms' | 'bathrooms' | 'guests'. */
export type FilterKey = (typeof FILTER_DEFS)[number]['key'];

/** One active (non-'any') filter, as a removable chip ({ key, label, value }). */
export type ActiveFilter = ReturnType<typeof activeFilters>[number];
