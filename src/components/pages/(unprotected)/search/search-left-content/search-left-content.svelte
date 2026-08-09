<script lang="ts">
	// COMPONENTS
	import AccommodationCard from '@/features/accommodations/components/accommodation-card/accommodation-card.svelte';
	import SearchLeftContentHeader from './search-left-content-header.svelte';
	import SearchFiltersEmpty from '../empty/search-filters-empty.svelte';
	import SearchResultsLoading from '../loading/search-results-loading.svelte';
	import Spinner from '@/components/ui/spinner/spinner.svelte';

	// UTILS
	import { cn } from '@/utils/utils.js';
	import { infiniteScroll } from '@/components/ui/infinite-scroll/infinite-scroll.svelte.js';

	// TYPES
	import type { Id } from '@/convex/_generated/dataModel';
	import type { GoogleMapHandle } from '@/components/ui/google-map/types';
	import type { SearchAccommodation } from '@/shared/features/accommodation/types/accommodationTypes';
	import type { SearchState } from '../types';

	/**
	 * The results list. `searchAccommodations` is the pages loaded SO FAR, not the whole matching
	 * set — the sentinel asks the server for the next page, which is the difference between this
	 * and the previous version (it received everything and sliced it locally).
	 */
	let {
		searchAccommodations,
		hasMore,
		loadingMore,
		onLoadMore,
		total,
		counting,
		isEmpty,
		search,
		mobileView,
		selectedId,
		mapHandle,
		location,
		loading = false
	}: {
		searchAccommodations: SearchAccommodation[];
		/** More pages exist on the server. */
		hasMore: boolean;
		/** A page request is in flight — blocks a double-fire and shows the tail spinner. */
		loadingMore: boolean;
		onLoadMore: () => void;
		/** Exact result count once `counting` is false; a lower bound while it is true. */
		total: number;
		counting: boolean;
		isEmpty: boolean;
		search: SearchState;
		mobileView: 'list' | 'map';
		selectedId: Id<'apartments'> | null;
		mapHandle?: GoogleMapHandle;
		location: string;
		loading?: boolean;
	} = $props();

	function handleAccommodationHover(id: string | null) {
		mapHandle?.setFocus(id);
	}
</script>

<!-- LEFT: results list -->
<section
	class={cn(
		'mx-auto w-full max-w-3xl px-4 pt-5 pb-24 sm:px-6 lg:mx-0 lg:max-w-none lg:px-8 lg:pb-10',
		mobileView === 'map' && 'hidden lg:block'
	)}
>
	<SearchLeftContentHeader count={total} {counting} {location} {search} {loading} />

	{#if loading}
		<SearchResultsLoading />
	{:else if isEmpty}
		<SearchFiltersEmpty {search} {location} />
	{:else}
		<div class="grid grid-cols-1 gap-x-5 gap-y-7 sm:grid-cols-2 xl:grid-cols-3">
			{#each searchAccommodations as accommodation (accommodation.id)}
				<AccommodationCard
					{accommodation}
					selected={accommodation.id === selectedId}
					onhover={handleAccommodationHover}
				/>
			{/each}
		</div>

		{#if hasMore}
			<!-- Sentinel. Keyed on the loaded count so a page that lands short — a read guard
			     tripped, or the date filter rejected most of what it walked — re-observes and
			     keeps filling until the viewport is covered, then waits for real scrolling. -->
			{#key searchAccommodations.length}
				<div
					class="flex h-12 items-center justify-center"
					{@attach infiniteScroll(() => ({
						onLoadMore,
						hasMore,
						loading: loadingMore
					}))}
				>
					{#if loadingMore}
						<Spinner />
					{/if}
				</div>
			{/key}
		{/if}
	{/if}
</section>
