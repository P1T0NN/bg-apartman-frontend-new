<script lang="ts">
	// LUCIDE ICONS
	import MapPinIcon from '@lucide/svelte/icons/map-pin';

	// TYPES
	import type { AccommodationDetail } from '@/features/accommodations/data/accommodationDummyData';

	let { accommodation }: { accommodation: AccommodationDetail } = $props();

	const area = $derived(
		[accommodation.city, accommodation.country].filter(Boolean).join(', ')
	);

	// Keyless embed — good enough for an approximate neighbourhood pin.
	const mapSrc = $derived(
		accommodation.coordinates
			? `https://maps.google.com/maps?q=${accommodation.coordinates.lat},${accommodation.coordinates.lng}&z=15&output=embed`
			: null
	);
</script>

<section class="space-y-4">
	<div class="space-y-1">
		<h2 class="text-lg font-semibold tracking-tight">Where you’ll be</h2>
		<p class="flex items-center gap-1.5 text-sm text-muted-foreground">
			<MapPinIcon class="size-4 shrink-0" aria-hidden="true" />
			{area}
		</p>
	</div>

	{#if mapSrc}
		<div class="overflow-hidden rounded-2xl border bg-muted">
			<iframe
				title={`Map of ${accommodation.title}`}
				src={mapSrc}
				class="aspect-[16/9] w-full"
				loading="lazy"
				referrerpolicy="no-referrer-when-downgrade"
			></iframe>
		</div>
	{/if}

	<p class="text-sm text-muted-foreground">
		The exact address is shared with you once your booking is confirmed.
	</p>
</section>
