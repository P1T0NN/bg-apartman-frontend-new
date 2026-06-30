<script lang="ts">
	// CONFIG
	import { PAGINATION_DATA } from '@/shared/config.js';

	// COMPONENTS
	import AccommodationCard from '@/features/accommodations/components/accommodation-card/accommodation-card.svelte';
	import SearchLeftContentHeader from './search-left-content-header.svelte';
	import SearchFiltersEmpty from '../empty/search-filters-empty.svelte';

	// UTILS
	import { cn } from '@/utils/utils.js';
	import { infiniteScroll } from '@/shared/components/ui/infinite-scroll/infinite-scroll.svelte.js';

	// TYPES
	import type { Id } from '@/convex/_generated/dataModel';
	import type { GoogleMapHandle } from '@/shared/components/ui/google-map/types';
	import type { SearchListing } from '@/shared/features/accommodation/types/accommodationTypes';
	import type { SearchState } from '../types';

	let {
		searchListings,
		search,
		mobileView,
		selectedId,
		mapHandle,
		location
	}: {
		searchListings: SearchListing[];
		search: SearchState;
		mobileView: 'list' | 'map';
		selectedId: Id<'apartments'> | null;
		mapHandle?: GoogleMapHandle;
		location: string;
	} = $props();

	// The map shows every result; the list pages in as you scroll. Clicking a pin
	// or hovering a card links the two without the user having to think about it.
	const PAGE_SIZE = PAGINATION_DATA.INFINITE_SCROLL_PAGE_SIZE;

	let visibleCount = $state(PAGE_SIZE);

	// New filtered set (identity change) → restart pagination at page 1.
	$effect(() => {
		if (searchListings) visibleCount = PAGE_SIZE;
	});

	const visible = $derived(searchListings.slice(0, visibleCount));
	const hasMore = $derived(visibleCount < searchListings.length);

	function handleListingHover(id: string | null) {
		mapHandle?.setFocus(id);
	}

	const loadMore = () => (visibleCount = Math.min(visibleCount + PAGE_SIZE, searchListings.length));
</script>

<!-- LEFT: results list -->
<section
	class={cn(
		'mx-auto w-full max-w-3xl px-4 pt-5 pb-24 sm:px-6 lg:mx-0 lg:max-w-none lg:px-8 lg:pb-10',
		mobileView === 'map' && 'hidden lg:block'
	)}
>
	<SearchLeftContentHeader count={searchListings.length} {location} {search} />

	{#if searchListings.length === 0}
		<SearchFiltersEmpty {search} {location} />
	{:else}
		<div class="grid grid-cols-1 gap-x-5 gap-y-7 sm:grid-cols-2 xl:grid-cols-3">
			{#each visible as listing (listing.id)}
				<AccommodationCard 
					{listing} 
					selected={listing.id === selectedId} 
					onhover={handleListingHover} 
				/>
			{/each}
		</div>

		<!-- Sentinel. Keyed on count so a short first page re-observes and keeps
	        filling until the viewport is covered, then waits for real scrolling. -->
		{#if hasMore}
			{#key visibleCount}
				<div class="h-10" {@attach infiniteScroll(() => ({ onLoadMore: loadMore, hasMore }))}></div>
			{/key}
		{/if}
	{/if}
</section>
