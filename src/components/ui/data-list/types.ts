// This module owns ONLY the list-specific snippet/layout types. The pagination payload and
// the strategy union are imported from where they are defined — no re-export corridor.

export type DataListItemSnippetProps<T> = {
	item: T;
};

export type DataListControlsPlace = 'top' | 'bottom';
