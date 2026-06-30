<script lang="ts">
	// SVELTEKIT IMPORTS
	import { MediaQuery } from 'svelte/reactivity';

	// COMPONENTS
	import GoogleMap from '@/shared/components/ui/google-map/google-map.svelte';
	import CustomMarker from '@/shared/components/ui/google-map/custom-marker.svelte';
    import SearchMarkerSelectedCard from './search-marker-selected-card.svelte';

	// UTILS
	import { cn } from '@/utils/utils.js';
	import { formatCurrency } from '@/utils/formatters';

	// TYPES
	import type { SearchListing } from '@/shared/features/accommodation/types/accommodationTypes';
	import type { Id } from '@/convex/_generated/dataModel';
	import type { GoogleMapHandle } from '@/shared/components/ui/google-map/types';

	// selectedId and mapHandle are written here (marker click sets the selection; the
	// GoogleMap binds its instance into mapHandle), so they're $bindable — that's what
	// lets the parent share both with the left list for card highlight + hover focus.
	let {
		searchListings,
		mobileView,
		selectedId = $bindable(),
		mapHandle = $bindable()
	}: {
		searchListings: SearchListing[];
		mobileView: 'list' | 'map';
		selectedId: Id<'apartments'> | null;
		mapHandle?: GoogleMapHandle;
	} = $props();

	const isDesktop = new MediaQuery('(min-width: 1024px)');

	const showMap = $derived(isDesktop.current || mobileView === 'map');
	const selected = $derived(searchListings.find((l) => l.id === selectedId) ?? null);

	function selectFromMap(listing: SearchListing) {
		selectedId = listing.id;
		mapHandle?.setSelected(listing.id);
		// Bring the matching card into view in the desktop list for context.
		document
			.getElementById(`listing-${listing.id}`)
			?.scrollIntoView({ block: 'center', behavior: 'smooth' });
	}
</script>

<!-- RIGHT: map (sticky on desktop, full-screen overlay on mobile) -->
<aside
	class={cn(
		'lg:sticky lg:top-14 lg:block lg:h-[calc(100dvh-3.5rem)]',
		mobileView === 'map' ? 'fixed inset-x-0 top-14 bottom-0 z-30 block' : 'hidden'
	)}
>
	{#if showMap}
		<GoogleMap
			bind:this={mapHandle}
			markers={searchListings}
			center={{ lat: 44.8155, lng: 20.4612 }}
			zoom={13}
			cluster
			fitBounds={{ once: true, padding: 64, maxZoom: 15 }}
			onMarkerClick={selectFromMap}
			class="h-full w-full rounded-none"
		>
			{#snippet markerContent(listing, ctx)}
				<CustomMarker
					label={formatCurrency(listing.pricePerNight)}
					variant={ctx.selectedId === listing.id || ctx.highlightedId === listing.id
						? 'selected'
						: 'default'}
					compact={ctx.zoom < 12}
				/>
			{/snippet}

			<!-- Clicking a pin docks a preview card at the bottom of the map (above the
                FAB on mobile). pointer-events-none on the wrapper keeps the rest of the
                map pannable; only the card itself catches clicks. -->
			{#snippet overlay()}
				{#if selected}
					<SearchMarkerSelectedCard 
						{selected}
						{mapHandle}
						bind:selectedId
					/>
				{/if}
			{/snippet}
		</GoogleMap>
	{/if}
</aside>
