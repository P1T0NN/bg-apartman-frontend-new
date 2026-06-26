<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';
	import { localizeHref } from '@/shared/lib/paraglide/runtime';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants';

	// CLASSES
	import { activeFilters } from '../search-state';

	// COMPONENTS
	import { Button } from '@/shared/components/ui/button/index.js';
	import SearchFiltersClearButton from '../search-left-content/search-filters-clear-button.svelte';

	// TYPES
	import type { SearchState } from '../types';

	// LUCIDE ICONS
	import MapPinOffIcon from '@lucide/svelte/icons/map-pin-off';
	import SearchIcon from '@lucide/svelte/icons/search';

	let {
		search,
		location
	}: {
		search: SearchState;
		location: string;
	} = $props();

	const hasCountFilters = $derived(activeFilters(search).length > 0);

	const description = $derived(
		location
			? m['SearchPage.SearchFiltersEmpty.descriptionLocation']({ location })
			: m['SearchPage.SearchFiltersEmpty.descriptionFilters']()
	);
</script>

<div
	class="flex flex-col items-center justify-center gap-5 rounded-xl border border-dashed px-6 py-14 text-center sm:py-16"
>
	<div class="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
		<MapPinOffIcon class="size-7" aria-hidden="true" />
	</div>

	<div class="flex max-w-md flex-col gap-1.5">
		<h2 class="text-lg font-semibold tracking-tight">
			{m['SearchPage.SearchFiltersEmpty.title']()}
		</h2>
		<p class="text-sm text-muted-foreground">{description}</p>
	</div>

	<div class="flex flex-wrap items-center justify-center gap-2">
		{#if hasCountFilters}
			<SearchFiltersClearButton {search} variant="outline" size="sm">
				{m['SearchPage.SearchFiltersEmpty.clearFilters']()}
			</SearchFiltersClearButton>
		{/if}

		<Button href={localizeHref(UNPROTECTED_PAGE_ENDPOINTS.ROOT)} variant="outline" size="sm">
			<SearchIcon class="size-4" aria-hidden="true" />
			{m['SearchPage.SearchFiltersEmpty.newSearch']()}
		</Button>
	</div>
</div>
