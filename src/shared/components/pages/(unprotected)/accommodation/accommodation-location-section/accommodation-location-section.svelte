<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';

	// COMPONENTS
	import AccommodationLocationMap from './accommodation-location-map.svelte';

	// TYPES
	import type { AccommodationDetail } from '@/features/accommodations/data/accommodationDummyData';

	// LUCIDE ICONS
	import MapPinIcon from '@lucide/svelte/icons/map-pin';

	let { accommodation }: { accommodation: AccommodationDetail } = $props();

	const area = $derived([accommodation.city, accommodation.country].filter(Boolean).join(', '));

	const mapSrc = $derived(
		accommodation.coordinates
			? `https://maps.google.com/maps?q=${accommodation.coordinates.lat},${accommodation.coordinates.lng}&z=15&output=embed`
			: null
	);
</script>

<section class="space-y-4">
	<div class="space-y-1">
		<h2 class="text-lg font-semibold tracking-tight">{m['AccommodationPage.AccommodationLocationSection.title']()}</h2>

		<p class="flex items-center gap-1.5 text-sm text-muted-foreground">
			<MapPinIcon class="size-4 shrink-0" aria-hidden="true" />
			{area}
		</p>
	</div>

	{#if mapSrc}
		<AccommodationLocationMap 
			title={accommodation.title} 
			mapSrc={mapSrc} 
		/>
	{/if}
</section>
