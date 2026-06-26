<script lang="ts" generics="T extends Record<string, unknown>">
	// LIBRARIES
	import { useQuery } from 'convex-svelte';

	// CONFIG
	import { PAGINATION_DATA } from '@/shared/config.js';

	// COMPONENTS
	import DataList from './data-list.svelte';

	// TYPES
	import type { Snippet } from 'svelte';
	import type { FunctionReference } from 'convex/server';
	import type {
		DataListControlsPlace,
		DataListItemSnippetProps,
		DataTableOptimizationStrategy,
		PaginatedListPayload
	} from './types.js';

	type ConvexPaginatedListQuery<T extends Record<string, unknown>> = FunctionReference<
		'query',
		'public',
		Record<string, unknown>,
		PaginatedListPayload<T>
	>;

	let {
		class: className,
		listClass,
		query,
		queryArgs,
		optimizationStrategy = PAGINATION_DATA.DEFAULT_OPTIMIZATION_STRATEGY,
		pageSize = PAGINATION_DATA.DEFAULT_PAGE_SIZE,
		controlsPlace = 'bottom',
		getItemKey,
		/**
		 * Portfolio-wide total when a separate summary query drives empty/loading UX.
		 * When set, `isEmpty` and `showPagination` derive from this instead of the list page.
		 */
		totalCount,
		/** External loading (e.g. summary query) merged with list pending state. */
		summaryLoading = false,
		/** External error (e.g. summary query) merged with list query errors. */
		hasError: externalHasError = false,
		item: itemSnippet,
		empty,
		error,
		loading
	}: {
		class?: string;
		listClass?: string;
		query: ConvexPaginatedListQuery<T>;
		/**
		 * Extra args forwarded to the query alongside `paginationOpts` / `page`.
		 * Value changes reset the cursor stack because cursors are tied to a specific access spec.
		 */
		queryArgs?: Record<string, unknown>;
		optimizationStrategy?: DataTableOptimizationStrategy;
		pageSize?: number;
		controlsPlace?: DataListControlsPlace;
		getItemKey?: (item: T, index: number) => string;
		totalCount?: number;
		summaryLoading?: boolean;
		hasError?: boolean;
		item: Snippet<[DataListItemSnippetProps<T>]>;
		empty?: Snippet;
		error?: Snippet;
		loading?: Snippet;
	} = $props();

	let page = $state(1);
	let cursorByPage = $state<Array<string | null>>([null]);

	const mergedQueryArgs = $derived(queryArgs ?? {});

	const queryArgsKey = $derived(JSON.stringify(mergedQueryArgs));

	$effect(() => {
		void query;
		void queryArgsKey;
		cursorByPage = [null];
		page = 1;
	});

	// svelte-ignore state_referenced_locally
	const listQuery = useQuery(
		query,
		() => {
			const extra = mergedQueryArgs;
			switch (optimizationStrategy) {
				case 'cursor': {
					const cursor = cursorByPage[page - 1] ?? null;
					return {
						...extra,
						paginationOpts: { numItems: pageSize, cursor }
					};
				}
				case 'offset':
					return {
						...extra,
						page,
						paginationOpts: { numItems: pageSize, cursor: null }
					};
				default: {
					const _never: never = optimizationStrategy;
					return _never;
				}
			}
		},
		{ keepPreviousData: true }
	);

	const listPayload = $derived(listQuery.data as PaginatedListPayload<T> | undefined);

	const items = $derived((listPayload?.page ?? []) as T[]);

	let lastTotalCount = $state(0);
	$effect(() => {
		if (optimizationStrategy !== 'offset') return;
		const n = listPayload?.totalCount;
		if (typeof n === 'number' && n !== lastTotalCount) lastTotalCount = n;
	});

	const totalPages = $derived(
		optimizationStrategy === 'offset'
			? Math.max(1, Math.ceil(lastTotalCount / pageSize))
			: undefined
	);

	$effect(() => {
		if (optimizationStrategy !== 'cursor' || !listPayload) return;
		if (listPayload.isDone) return;
		const next = listPayload.continueCursor;
		if (cursorByPage[page] !== next) {
			const copy = cursorByPage.slice();
			copy[page] = next;
			cursorByPage = copy;
		}
	});

	const canGoNext = $derived(
		optimizationStrategy === 'cursor' && !!listPayload && !listPayload.isDone
	);

	$effect(() => {
		if (optimizationStrategy !== 'offset' || listPayload === undefined) return;
		const max = totalPages ?? 1;
		if (page > max) page = max;
	});

	const listPending = $derived(listPayload === undefined && listQuery.error === undefined);
	const queryLoading = $derived(listQuery.isLoading && listPayload === undefined);

	const hasError = $derived(externalHasError || Boolean(listQuery.error));

	const isEmpty = $derived(
		totalCount !== undefined ? totalCount === 0 : items.length === 0 && listPayload !== undefined
	);

	const isLoading = $derived(
		summaryLoading || (listPending && (totalCount === undefined || totalCount > 0))
	);

	const showPagination = $derived(
		totalCount !== undefined
			? totalCount > pageSize
			: optimizationStrategy === 'offset'
				? (totalPages ?? 1) > 1
				: page > 1 || canGoNext
	);
</script>

<DataList
	class={className}
	{listClass}
	{items}
	{getItemKey}
	{hasError}
	{isLoading}
	{isEmpty}
	item={itemSnippet}
	{empty}
	{error}
	{loading}
	bind:page
	{totalPages}
	{canGoNext}
	paginationIsLoading={listPending}
	{queryLoading}
	hasResult={listPayload !== undefined}
	{showPagination}
	{controlsPlace}
/>
