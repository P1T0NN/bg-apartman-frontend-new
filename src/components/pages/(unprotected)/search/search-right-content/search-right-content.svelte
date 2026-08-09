<script lang="ts">
	// SVELTEKIT IMPORTS
	import { MediaQuery } from 'svelte/reactivity';

	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useConvexClient } from 'convex-svelte';

	// COMPONENTS
	import GoogleMap from '@/components/ui/google-map/google-map.svelte';
	import CustomMarker from '@/components/ui/google-map/custom-marker.svelte';
	import SearchMarkerSelectedCard from './search-marker-selected-card.svelte';

	// UTILS
	import { cn } from '@/utils/utils.js';
	import { formatCurrency } from '@/utils/formatters';
	import { safeQuery } from '@/utils/convexHelpers';

	// TYPES
	import type {
		SearchAccommodation,
		SearchMarker
	} from '@/shared/features/accommodation/types/accommodationTypes';
	import type { Id } from '@/convex/_generated/dataModel';
	import type { GoogleMapHandle } from '@/components/ui/google-map/types';

	// selectedId and mapHandle are written here (marker click sets the selection; the
	// GoogleMap binds its instance into mapHandle), so they're $bindable — that's what
	// lets the parent share both with the left list for card highlight + hover focus.
	let {
		markers,
		mobileView,
		selectedId = $bindable(),
		mapHandle = $bindable()
	}: {
		/**
		 * EVERY matching listing, four fields each. The parent streams these in pages until the
		 * set is exhausted, so pins keep appearing rather than the map waiting on one giant
		 * payload — and rather than showing only the listings the list has scrolled to.
		 */
		markers: SearchMarker[];
		mobileView: 'list' | 'map';
		selectedId: Id<'apartments'> | null;
		mapHandle?: GoogleMapHandle;
	} = $props();

	const convex = useConvexClient();
	const isDesktop = new MediaQuery('(min-width: 1024px)');

	const showMap = $derived(isDesktop.current || mobileView === 'map');

	/**
	 * The preview card for the clicked pin — ONE document read, on click.
	 *
	 * This is what buys the lean marker payload: the card's fields (photo, title, counts) are
	 * fetched for the pin someone actually opened instead of for all of them up front. Sequence
	 * guard because clicking pins faster than the network can answer must not leave an older
	 * response on screen.
	 */
	let selected = $state.raw<SearchAccommodation | null>(null);
	let latestRequest = 0;

	$effect(() => {
		const id = selectedId;

		if (!id) {
			latestRequest++;
			selected = null;
			return;
		}

		const mine = ++latestRequest;
		void safeQuery(
			convex,
			api.tables.accommodations.queries.fetchSearchAccommodationCardSafe
				.fetchSearchAccommodationCardSafe,
			{ id }
		).then((card) => {
			if (mine !== latestRequest) return;
			// `null` = unpublished or deleted since the markers loaded. Drop the selection
			// rather than dock an empty card.
			selected = card ?? null;
		});
	});

	function selectFromMap(marker: SearchMarker) {
		selectedId = marker.id;
		mapHandle?.setSelected(marker.id);
		// Bring the matching card into view in the desktop list for context — only possible when
		// the list has already paged that far, which is exactly when it's useful.
		document
			.getElementById(`accommodation-${marker.id}`)
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
			{markers}
			center={{ lat: 44.8155, lng: 20.4612 }}
			zoom={13}
			cluster
			fitBounds={{ once: true, padding: 64, maxZoom: 15 }}
			onMarkerClick={selectFromMap}
			class="h-full w-full rounded-none"
		>
			{#snippet markerContent(marker, ctx)}
				<CustomMarker
					label={formatCurrency(marker.pricePerNight)}
					variant={ctx.selectedId === marker.id || ctx.highlightedId === marker.id
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
					<SearchMarkerSelectedCard {selected} {mapHandle} bind:selectedId />
				{/if}
			{/snippet}
		</GoogleMap>
	{/if}
</aside>
