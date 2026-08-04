<script lang="ts">
	// TYPES
	import type { typesBookingSafe } from '@/shared/features/booking/types/bookingTypes';

	// LUCIDE ICONS
	import MapPinIcon from '@lucide/svelte/icons/map-pin';

	let {
		apartment,
		hostName
	}: {
		apartment: typesBookingSafe['apartment'];
		/** Host label under the property — admin context only. */
		hostName?: string;
	} = $props();
</script>

<section class="space-y-2">
	<h3 class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Property</h3>
	<div class="flex items-center gap-3">
		<img
			src={apartment.imageUrl}
			alt={apartment.title}
			class="size-12 shrink-0 rounded-md object-cover ring-1 ring-border"
			loading="lazy"
		/>

		<div class="min-w-0">
			<p class="truncate text-sm font-medium">{apartment.title}</p>

			<p class="flex items-center gap-1 truncate text-xs text-muted-foreground">
				<MapPinIcon class="size-3 shrink-0" aria-hidden="true" />
				{apartment.city}
			</p>

			{#if hostName}
				<p class="truncate text-xs text-muted-foreground">Host: {hostName}</p>
			{/if}
		</div>
	</div>
</section>
