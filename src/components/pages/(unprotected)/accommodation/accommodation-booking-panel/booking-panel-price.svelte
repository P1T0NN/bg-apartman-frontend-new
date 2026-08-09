<script lang="ts">
	// UTILS
	import { effectiveNightlyPrice } from '@/shared/features/pricing/utils/calculatePrice';
	import { hasNightlyDiscount } from '@/features/accommodations/utils/accommodationPresentation';
	import { formatCurrency } from '@/utils/formatters';

	// TYPES
	import type { typesAccommodationEnriched } from '@/shared/features/accommodation/types/accommodationTypes';

	let { accommodation }: { accommodation: typesAccommodationEnriched } = $props();

	// Accommodation page shows a starting nightly price; the real total is on the book page.
	const nightly = $derived(effectiveNightlyPrice(accommodation));
	// Discounted price reads as the deal: current in green, the old price struck in destructive.
	const discounted = $derived(hasNightlyDiscount(accommodation));
</script>

<div class="flex items-baseline gap-1.5">
	<span class="text-sm text-muted-foreground">from</span>
	<span class="text-2xl font-semibold {discounted ? 'text-emerald-700 dark:text-emerald-300' : ''}"
		>{formatCurrency(nightly)}</span
	>
	<span class="text-muted-foreground">night</span>

	{#if discounted}
		<span class="text-sm text-destructive line-through">
			{formatCurrency(accommodation.pricePerNight)}
		</span>
	{/if}
</div>
