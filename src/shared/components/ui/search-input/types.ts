// TYPES
import type { WithElementRef } from '@/utils/utils.js';
import type { HTMLInputAttributes } from 'svelte/elements';

export type SearchInputItem = {
	id: string;
	title: string;
	description?: string;
	category?: string;
};

export type SearchInputSelectHandler = (item: SearchInputItem) => void;

export type SearchInputBaseProps = WithElementRef<
	Omit<HTMLInputAttributes, 'type' | 'value' | 'onselect' | 'files'>,
	HTMLInputElement
> & {
	value?: string;
	dropdownClass?: string;
	minQueryLength?: number;
	maxResults?: number;
	loadingText?: string;
	emptyTitle?: string;
	emptyDescription?: string;
	selectValueOnSelect?: boolean;
	onSelect?: SearchInputSelectHandler;
	/**
	 * Backward-compatible alias. Prefer `onSelect` for new usage because this is
	 * selection, not a raw pointer interaction.
	 */
	onClick?: SearchInputSelectHandler;
};

export type SearchInputProps = SearchInputBaseProps & {
	items?: SearchInputItem[];
	loading?: boolean;
	error?: string | null;
	showEmpty?: boolean;
};

export type SearchInputLocalProps = SearchInputBaseProps & {
	items: SearchInputItem[];
	filter?: (item: SearchInputItem, search: string) => boolean;
};

export type SearchInputResultPayload<TRow> =
	| SearchInputItem[]
	| TRow[]
	| {
			page?: TRow[];
	  };

export type SearchInputRemoteSearchParams = {
	search: string;
	maxResults: number;
	cursor?: string | null;
};

export type SearchInputRemoteCommandInput<Source extends string = string> =
	SearchInputRemoteSearchParams & {
		source: Source;
	};

export type SearchInputRemoteCommandResult = {
	page: SearchInputItem[];
	isDone: boolean;
	continueCursor: string;
};

export type SearchInputRemoteProps<TRow = SearchInputItem> = SearchInputBaseProps & {
	search: (params: SearchInputRemoteSearchParams) => Promise<SearchInputResultPayload<TRow>>;
	mapItem?: (row: TRow) => SearchInputItem;
	searchDebounceMs?: number;
	getErrorMessage?: (error: unknown) => string;
};

export type SearchDropdownProps = {
	listboxId: string;
	inputId: string;
	items: SearchInputItem[];
	activeIndex?: number;
	dropdownClass?: string;
	loading?: boolean;
	error?: string | null;
	loadingText?: string;
	emptyTitle?: string;
	emptyDescription?: string;
	onActiveIndexChange?: (index: number) => void;
	onSelect: (item: SearchInputItem) => void;
};

export type SearchDropdownItemProps = {
	item: SearchInputItem;
	optionId: string;
	active: boolean;
	onSelect: () => void;
	onHover: () => void;
};
