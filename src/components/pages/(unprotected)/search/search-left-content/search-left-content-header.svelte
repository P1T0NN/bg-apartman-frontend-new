<script lang="ts">
	// I18N
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import SearchFilters from './search-filters.svelte';
	import SearchFiltersClearButton from './search-filters-clear-button.svelte';
	import SearchFiltersBadge from './search-filters-badge.svelte';
	import Spinner from '@/components/ui/spinner/spinner.svelte';

	// UTILS
	import { activeFilters } from '../search-state';

	// TYPES
	import type { SearchState } from '../types';

	let {
		count,
		counting = false,
		location,
		search,
		loading = false
	}: {
		count: number;
		/**
		 * The count is still a lower bound — the marker stream that produces it hasn't reached
		 * the end of the set yet. Rendered as "120+" rather than a number that will change.
		 */
		counting?: boolean;
		location: string;
		search: SearchState;
		loading?: boolean;
	} = $props();

	const chips = $derived(activeFilters(search));
</script>

<header class="pb-4">
	<div class="flex items-start justify-between gap-3">
		<div>
			<h1 class="text-lg font-semibold tracking-tight">
				{#if loading}
					<Spinner /> {m['SearchPage.SearchLeftContentHeader.searchingStaysIn']({ location })}
				{:else}
					{m['SearchPage.SearchLeftContentHeader.staysIn']({ count, location })}{counting ? '+' : ''}
				{/if}
			</h1>
			<p class="text-sm text-muted-foreground">
				{m['SearchPage.SearchLeftContentHeader.pricesIncludeAllFees']()}
			</p>
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
				{m['SearchPage.SearchLeftContentHeader.clearAll']()}
			</SearchFiltersClearButton>
		</div>
	{/if}
</header>
