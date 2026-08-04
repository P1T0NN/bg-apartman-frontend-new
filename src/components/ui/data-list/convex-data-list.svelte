<script lang="ts" generics="T extends Record<string, unknown>">
	// LIBRARIES
	import { useQuery } from 'convex-svelte';

	// CONFIG
	import { PAGINATION_DATA } from '@/shared/config.js';

	// COMPONENTS
	import DataList from './data-list.svelte';
	import { ErrorComponent } from '@/components/ui/error-component/index.js';

	// UTILS
	import { convexOneShotQuery } from '@/utils/convexOneShot.svelte.js';

	// TYPES
	import type { Snippet } from 'svelte';
	import type { FunctionReference } from 'convex/server';
	import type { DataListControlsPlace, DataListItemSnippetProps } from './types.js';
	import type { DataTableOptimizationStrategy } from '../data-table/types.js';
	import type { PaginatedListPayload } from '@/shared/features/pagination/types/paginationTypes';

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
		loading,
		onReady,
		realtime = false
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
		/**
		 * Handed back a `refetch()` for THIS list. Call it after a mutation made from an item
		 * or a dialog on the same screen, so a one-shot list shows your own write. No-op when
		 * `realtime`.
		 */
		onReady?: (controls: { refetch: () => void }) => void;
		/**
		 * Hold a live subscription instead of fetching once per args change. OFF by default
		 * (`docs/GeneralSystemDesignRule.md`) — see `ConvexDataTable.realtime` for the full
		 * rationale. Read once at mount; do not toggle at runtime.
		 */
		realtime?: boolean;
		empty?: Snippet;
		/**
		 * Override the failure UI. Defaults to a shared `ErrorComponent` — a failed query must
		 * never fall through to the empty state, which reports a broken read as "nothing here".
		 */
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

	function currentArgs(): Record<string, unknown> {
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
	}

	// Both return the same `{ data, error, isLoading }` surface, so nothing downstream branches
	// on which one is in play. `realtime` is read once here on purpose — swapping a subscription
	// for a one-shot mid-life would strand the open channel.
	// svelte-ignore state_referenced_locally
	const listQuery = realtime
		? useQuery(query, currentArgs, { keepPreviousData: true })
		: convexOneShotQuery(query, currentArgs, { keepPreviousData: true });

	// `useQuery` re-runs itself on every relevant write, so its refetch is a no-op; the
	// one-shot path needs a real one to show a mutation made from this very screen.
	const refetch = () => {
		if (!realtime) (listQuery as { refetch: () => void }).refetch();
	};
	$effect(() => onReady?.({ refetch }));

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
	error={error ?? defaultError}
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

<!--
  Default failure UI, overridable via the `error` snippet. `onRetry` reloads instead of the
  button's `invalidateAll()` default: this is a Convex `useQuery`, which only re-subscribes
  when its args change or the component remounts.
-->
{#snippet defaultError()}
	<ErrorComponent
		variant="plain"
		title="Couldn't load data"
		description="Something went wrong while loading this list. Please try again."
		retryLabel="Retry"
		onRetry={() => location.reload()}
	/>
{/snippet}
