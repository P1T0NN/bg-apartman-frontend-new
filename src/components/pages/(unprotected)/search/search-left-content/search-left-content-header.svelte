<script lang="ts">
	// COMPONENTS
	import SearchFilters from './search-filters.svelte';
	import SearchFiltersClearButton from './search-filters-clear-button.svelte';
	import SearchFiltersBadge from './search-filters-badge.svelte';

	// UTILS
	import { activeFilters } from '../search-state';

	// TYPES
	import type { SearchState } from '../types';

	let {
		count,
		location,
		search
	}: {
		count: number;
		location: string;
		search: SearchState;
	} = $props();

	const chips = $derived(activeFilters(search));
</script>

<header class="pb-4">
	<div class="flex items-start justify-between gap-3">
		<div>
			<h1 class="text-lg font-semibold tracking-tight">
				{count} stays in {location}
			</h1>
			<p class="text-sm text-muted-foreground">Prices include all fees</p>
		</div>

		<SearchFilters {search} />
	</div>

	{#if chips.length > 0}
		<div class="flex flex-wrap items-center gap-2 pt-3">
			{#each chips as chip (chip.key)}
				<SearchFiltersBadge {search} {chip} />
			{/each}

			<SearchFiltersClearButton
				{search}
				variant="link"
				class="h-auto p-0 text-xs font-medium text-muted-foreground underline-offset-2"
			>
				Clear all
			</SearchFiltersClearButton>
		</div>
	{/if}
</header>
