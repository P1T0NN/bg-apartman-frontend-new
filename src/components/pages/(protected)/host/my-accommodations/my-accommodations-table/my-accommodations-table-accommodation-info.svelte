<script lang="ts">
	// CONFIG
	import { ACCOMMODATION_TYPES } from '@/shared/data/accommodationsData';

	// TYPES
	import type { typesAccommodation } from '@/shared/features/accommodation/types/accommodationTypes';

	// LUCIDE ICONS
	import ImageIcon from '@lucide/svelte/icons/image';

	let { row }: { row: typesAccommodation } = $props();

	const propertyTypeLabels = new Map(ACCOMMODATION_TYPES.map((type) => [type.value, type.label]));

	const typeLabel = $derived(propertyTypeLabels.get(row.type) ?? row.type);
</script>

<div class="flex min-w-0 items-center gap-3">
	<div class="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted ring-1 ring-border">
		{#if row.images[0]?.url}
			<img
				src={row.images[0].url}
				alt={row.images[0].alt ?? row.title}
				class="size-full object-cover"
				loading="lazy"
			/>
		{:else}
			<div class="flex size-full items-center justify-center text-muted-foreground">
				<ImageIcon class="size-5" aria-hidden="true" />
			</div>
		{/if}
	</div>

	<div class="min-w-0 space-y-1">
		<p class="truncate text-sm font-medium">{row.title}</p>
		<p class="truncate text-xs text-muted-foreground">
			{typeLabel}
			{#if row.city}
				in {row.city}
			{/if}
		</p>
	</div>
</div>
