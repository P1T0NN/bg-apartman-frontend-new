<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';

	// COMPONENTS
	import SuperhostBadge from '@/features/accommodations/components/superhost-badge.svelte';

	// UTILS
	import { accommodationTypeLabel } from '@/features/accommodations/utils/accommodationPresentation';

	// TYPES
	import type { typesAccommodationEnriched } from '@/shared/features/accommodation/types/accommodationTypes';

	let { accommodation }: { accommodation: typesAccommodationEnriched } = $props();

	const cover = $derived(accommodation.images[0]);
</script>

<div class="flex gap-4">
	<img
		src={cover?.url}
		alt={cover?.alt ?? accommodation.title}
		class="size-20 shrink-0 rounded-xl object-cover ring-1 ring-border"
		loading="lazy"
	/>
	<div class="min-w-0 space-y-0.5">
		<p class="text-xs text-muted-foreground">
			{m['BookAccommodationPage.BookSummaryAccommodation.typeInCity']({
				type: accommodationTypeLabel(accommodation.type),
				city: accommodation.city
			})}
		</p>
		<p class="truncate font-medium">{accommodation.title}</p>
		{#if accommodation.host.isSuperhost}
			<p class="text-xs text-muted-foreground">
				<SuperhostBadge variant="inline" /> · {accommodation.host.name}
			</p>
		{/if}
	</div>
</div>
