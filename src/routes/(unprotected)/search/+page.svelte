<script lang="ts">
	// COMPONENTS
	import SvelteHead from '@/shared/components/ui/svelte-head/svelte-head.svelte';
	import { Button } from '@/shared/components/ui/button/index.js';
	import SearchLeftContent from '@/shared/components/pages/(unprotected)/search/search-left-content/search-left-content.svelte';
	import SearchRightContent from '@/shared/components/pages/(unprotected)/search/search-right-content/search-right-content.svelte';

	// STATE
	import {
		useSearchState,
		atLeast
	} from '@/shared/components/pages/(unprotected)/search/search-state';

	// DATA
	import { searchListings } from '@/features/accommodations/data/searchResultsDummyData';

	// TYPES
	import type { GoogleMapHandle } from '@/shared/components/ui/google-map/types.js';
	import type { Id } from '@/convex/_generated/dataModel';

	// LUCIDE ICONS
	import MapIcon from '@lucide/svelte/icons/map';
	import ListIcon from '@lucide/svelte/icons/list';

	// nuqs keeps the query (location + filters) in the URL.
	const search = useSearchState();

	let selectedId = $state<Id<'apartments'> | null>(null);
	let mapHandle = $state.raw<GoogleMapHandle>();
	let mobileView = $state<'list' | 'map'>('list');

	const location = $derived(search.location.current?.trim());

	// Both panes (list + map) render the same filtered set, so they always agree.
	const filtered = $derived(
		searchListings.filter(
			(l) =>
				atLeast(l.bedrooms, search.bedrooms.current) &&
				atLeast(l.bathrooms, search.bathrooms.current) &&
				atLeast(l.maxGuests, search.guests.current)
		)
	);
</script>

<SvelteHead
	title={`Stays in ${location}`}
	description={`Browse ${searchListings.length} places to stay in ${location}.`}
/>

<div class="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,42%)] xl:grid-cols-[minmax(0,1fr)_38rem]">
	<SearchLeftContent
		searchListings={filtered}
		{search}
		{mobileView}
		{selectedId}
		{location}
		{mapHandle}
	/>

	<SearchRightContent searchListings={filtered} {mobileView} bind:selectedId bind:mapHandle />
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
