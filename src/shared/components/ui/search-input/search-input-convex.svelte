<script lang="ts" module>
	// TYPES
	import type { PaginatedListPayload } from '@/shared/components/ui/data-table/types.js';
	import type { SearchInputBaseProps, SearchInputItem } from './types.js';
	import type { FunctionReference } from 'convex/server';

	export type SearchListQuery<TRow extends Record<string, unknown> = Record<string, unknown>> =
		FunctionReference<
			'query',
			'public',
			Record<string, unknown>,
			PaginatedListPayload<TRow> | SearchInputItem[]
		>;

	export type SearchInputConvexProps<
		TRow extends Record<string, unknown> = Record<string, unknown>
	> = SearchInputBaseProps & {
		query: SearchListQuery<TRow>;
		mapItem?: (row: TRow) => SearchInputItem;
		queryArgs?: Record<string, unknown>;
		searchArgName?: string;
		searchDebounceMs?: number;
		includePaginationOpts?: boolean;
		getErrorMessage?: (error: unknown) => string;
	};
</script>

<script lang="ts" generics="TRow extends Record<string, unknown>">
	// LIBRARIES
	import { useConvexClient } from 'convex-svelte';

	// COMPONENTS
	import SearchInput from './search-input.svelte';

	// UTILS
	import { getSearchInputErrorMessage, mapSearchInputResults } from './searchInputUtils.js';

	let {
		ref = $bindable(null),
		value = $bindable(''),
		query,
		mapItem,
		queryArgs,
		searchArgName = 'search',
		searchDebounceMs = 300,
		maxResults = 5,
		minQueryLength = 1,
		includePaginationOpts = true,
		getErrorMessage = getSearchInputErrorMessage,
		...restProps
	}: SearchInputConvexProps<TRow> = $props();

	const convexClient = useConvexClient();

	let debouncedSearch = $state(value);
	let results = $state<SearchInputItem[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);

	$effect(() => {
		const nextSearch = value;
		const timeout = setTimeout(() => {
			debouncedSearch = nextSearch;
		}, searchDebounceMs);

		return () => clearTimeout(timeout);
	});

	$effect(() => {
		const searchTerm = debouncedSearch.trim();

		if (searchTerm.length < minQueryLength) {
			results = [];
			loading = false;
			error = null;
			return;
		}

		const args = {
			...(queryArgs ?? {}),
			[searchArgName]: searchTerm,
			...(includePaginationOpts ? { paginationOpts: { numItems: maxResults, cursor: null } } : {})
		};

		loading = true;
		error = null;

		return convexClient.onUpdate(
			query,
			args,
			(data) => {
				results = mapSearchInputResults(data, mapItem, maxResults);
				loading = false;
			},
			(cause) => {
				results = [];
				error = getErrorMessage(cause);
				loading = false;
			}
		);
	});
</script>

<SearchInput
	bind:ref
	bind:value
	items={results}
	{loading}
	{error}
	{minQueryLength}
	{maxResults}
	{...restProps}
/>
