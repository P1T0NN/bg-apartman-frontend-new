<script lang="ts">
	// CLASSES
	import {
		useSearchState,
		parseCount,
		type AccommodationSearchParams
	} from '@/components/pages/(unprotected)/search/search-state';

	// LIBRARIES
	import { api } from '@/convex/_generated/api';

	// CONFIG
	import { PAGINATION_DATA, SEARCH_DATA } from '@/shared/config';

	// UTILS
	import { convexOneShotPaginatedQuery } from '@/utils/convexOneShot.svelte';

	// COMPONENTS
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import { Button } from '@/components/ui/button/index.js';
	import SearchLeftContent from '@/components/pages/(unprotected)/search/search-left-content/search-left-content.svelte';
	import SearchRightContent from '@/components/pages/(unprotected)/search/search-right-content/search-right-content.svelte';

	// TYPES
	import type { GoogleMapHandle } from '@/components/ui/google-map/types.js';
	import type { Id } from '@/convex/_generated/dataModel';
	import type {
		SearchAccommodation,
		SearchMarker
	} from '@/shared/features/accommodation/types/accommodationTypes';

	// LUCIDE ICONS
	import MapIcon from '@lucide/svelte/icons/map';
	import ListIcon from '@lucide/svelte/icons/list';

	// nuqs keeps the query (location + filters) in the URL.
	const search = useSearchState();

	let selectedId = $state<Id<'apartments'> | null>(null);
	let mapHandle = $state.raw<GoogleMapHandle>();
	let mobileView = $state<'list' | 'map'>('list');

	const location = $derived(search.location.current?.trim());

	// The query args, decoded from the URL. `location` is the display label only; the query
	// matches on the picked region's `placeId`, which is language-independent.
	const params = $derived<AccommodationSearchParams>({
		placeId: search.placeId.current || undefined,
		location,
		checkIn: search.checkIn.current || undefined,
		checkOut: search.checkOut.current || undefined,
		bedrooms: parseCount(search.bedrooms.current),
		bathrooms: parseCount(search.bathrooms.current),
		guests: parseCount(search.guests.current)
	});

	/** What the server filters by. `location` is deliberately absent — it is a display label. */
	const queryArgs = $derived({
		placeId: params.placeId,
		checkIn: params.checkIn,
		checkOut: params.checkOut,
		bedrooms: params.bedrooms,
		bathrooms: params.bathrooms,
		guests: params.guests
	});

	/**
	 * TWO reads of the same matching set, because the two panes need different things and used
	 * to be forced into one shape:
	 *
	 *  - the LIST pages in as you scroll — 12 cards per request, server-side, so a region with
	 *    100,000 listings costs the same first page as one with 12;
	 *  - the MAP needs every pin, so it streams the lean 4-field marker shape and keeps asking
	 *    for the next page until the set is exhausted (the effect below). ~60 bytes a pin.
	 *
	 * Both are ONE-SHOT (`GeneralSystemDesignRule.md` — realtime is opt-in). Search results do
	 * not move under the viewer, and a subscription over a whole region's listings would re-run
	 * on every unrelated booking or listing edit in it. Changing a filter changes the args, and
	 * an args change refetches — which is the only freshness this page owes anyone.
	 */
	const list = convexOneShotPaginatedQuery<SearchAccommodation>(
		api.tables.accommodations.queries.fetchSearchAccommodationsSafe.fetchSearchAccommodationsSafe,
		() => queryArgs,
		() => ({ initialNumItems: PAGINATION_DATA.INFINITE_SCROLL_PAGE_SIZE })
	);

	const markers = convexOneShotPaginatedQuery<SearchMarker>(
		api.tables.accommodations.queries.fetchSearchMapMarkersSafe.fetchSearchMapMarkersSafe,
		() => queryArgs,
		() => ({ initialNumItems: SEARCH_DATA.MAP_MARKER_PAGE_SIZE })
	);

	/**
	 * Drain the marker stream. Converges rather than loops: `loadMore` is a no-op while a request
	 * is in flight, so this fires once per completed page and stops at 'Exhausted'.
	 *
	 * The `error` guard is load-bearing. A failed page leaves the accumulator not-loading and
	 * not-exhausted — which is the same `'CanLoadMore'` this effect reacts to — so without it a
	 * single failing request becomes an unbounded retry loop against the server. Stopping instead
	 * leaves the map short and the count reading "120+", which is at least honest; a filter change
	 * clears the error and resumes.
	 */
	$effect(() => {
		if (markers.error) return;
		if (markers.status === 'CanLoadMore') markers.loadMore(SEARCH_DATA.MAP_MARKER_PAGE_SIZE);
	});

	// The marker stream walks the WHOLE matching set, so once it is exhausted its length is the
	// exact result count — no aggregate, no second scan. Until then it is a lower bound, which
	// the header renders as "120+" rather than pretending to be done counting.
	const total = $derived(markers.results.length);
	const counting = $derived(markers.status !== 'Exhausted');

	const listLoading = $derived(list.status === 'LoadingFirstPage');
	const isEmpty = $derived(list.results.length === 0 && !listLoading);
</script>

<SvelteHead title={`Stays in ${location}`} description={`Browse places to stay in ${location}.`} />

<div class="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,42%)] xl:grid-cols-[minmax(0,1fr)_38rem]">
	<SearchLeftContent
		searchAccommodations={list.results}
		hasMore={list.status === 'CanLoadMore'}
		loadingMore={list.status === 'LoadingMore'}
		onLoadMore={() => list.loadMore(PAGINATION_DATA.INFINITE_SCROLL_PAGE_SIZE)}
		{total}
		{counting}
		{isEmpty}
		{search}
		{mobileView}
		{selectedId}
		{location}
		{mapHandle}
		loading={listLoading}
	/>

	<SearchRightContent markers={markers.results} {mobileView} bind:selectedId bind:mapHandle />
</div>

<!-- MOBILE: single toggle between list and map. -->
<Button
	size="lg"
	class="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-full px-5 shadow-lg lg:hidden"
	onclick={() => (mobileView = mobileView === 'map' ? 'list' : 'map')}
>
	{#if mobileView === 'map'}
		<ListIcon class="size-4" aria-hidden="true" /> Show list
	{:else}
		<MapIcon class="size-4" aria-hidden="true" /> Show map
	{/if}
</Button>
