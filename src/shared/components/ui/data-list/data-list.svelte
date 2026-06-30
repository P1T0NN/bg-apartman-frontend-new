<script lang="ts" generics="T extends Record<string, unknown>">
	// COMPONENTS
	import { PaginatedData } from '@/shared/components/ui/paginated-data/index.js';

	// UTILS
	import { cn } from '@/utils/utils.js';
	import { defaultRowKey } from '../data-table/dataTableUtils.js';

	// TYPES
	import type { Snippet } from 'svelte';
	import type { DataListControlsPlace, DataListItemSnippetProps } from './types.js';

	let {
		class: className,
		listClass = 'flex flex-col gap-2',
		items,
		getItemKey,
		hasError = false,
		isLoading = false,
		isEmpty = false,
		item: itemSnippet,
		empty,
		error,
		loading,
		page = $bindable(1),
		totalPages,
		canGoNext = false,
		paginationIsLoading = false,
		queryLoading = false,
		hasResult = true,
		showPagination = false,
		controlsPlace = 'bottom'
	}: {
		class?: string;
		/** Wrapper around the `{#each}` block. Defaults to a vertical stack. */
		listClass?: string;
		items: T[];
		getItemKey?: (item: T, index: number) => string;
		hasError?: boolean;
		isLoading?: boolean;
		isEmpty?: boolean;
		item: Snippet<[DataListItemSnippetProps<T>]>;
		empty?: Snippet;
		error?: Snippet;
		loading?: Snippet;
		/** 1-based page; bindable for parent-owned paginators. */
		page?: number;
		/** Offset mode: exact page count. Omit for cursor pagination. */
		totalPages?: number;
		/** Cursor mode: parent passes `!isDone` from the paginated payload. */
		canGoNext?: boolean;
		/** Loading state for pagination label/buttons (`PaginatedData.isLoading`). */
		paginationIsLoading?: boolean;
		/** Query in flight (`PaginatedData.queryLoading`). */
		queryLoading?: boolean;
		/** Current subscription has a resolved list payload. */
		hasResult?: boolean;
		showPagination?: boolean;
		controlsPlace?: DataListControlsPlace;
	} = $props();
</script>

<div class={cn('flex w-full flex-col gap-4', className)} data-slot="data-list">
	{#if hasError}
		{#if error}
			{@render error()}
		{/if}
	{:else if isLoading}
		{#if loading}
			{@render loading()}
		{/if}
	{:else if isEmpty}
		{#if empty}
			{@render empty()}
		{/if}
	{:else}
		{#if showPagination && controlsPlace === 'top'}
			<PaginatedData
				bind:page
				{totalPages}
				{canGoNext}
				isLoading={paginationIsLoading}
				{queryLoading}
				{hasResult}
			/>
		{/if}

		<div class={listClass}>
			{#each items as item, index (getItemKey?.(item, index) ?? defaultRowKey(item, index))}
				{@render itemSnippet({ item })}
			{/each}
		</div>

		{#if showPagination && controlsPlace === 'bottom'}
			<PaginatedData
				bind:page
				{totalPages}
				{canGoNext}
				isLoading={paginationIsLoading}
				{queryLoading}
				{hasResult}
			/>
		{/if}
	{/if}
</div>
