<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';

	// UTILS
	import { effectiveNightlyPrice } from '@/shared/features/pricing/utils/calculatePrice';
	import { hasNightlyDiscount } from '@/features/accommodations/utils/accommodationPresentation';
	import { formatCurrency } from '@/utils/formatters';

	// TYPES
	import type { typesAccommodationEnriched } from '@/shared/features/accommodation/types/accommodationTypes';

	let { accommodation }: { accommodation: typesAccommodationEnriched } = $props();

	// Listing page shows a starting nightly price; the real total is on the book page.
	const nightly = $derived(effectiveNightlyPrice(accommodation));
</script>

<div class="flex items-baseline gap-1.5">
	<span class="text-sm text-muted-foreground">{m['AccommodationPage.BookingPanelPrice.from']()}</span>
	<span class="text-2xl font-semibold">{formatCurrency(nightly)}</span>
	<span class="text-muted-foreground">{m['AccommodationPage.BookingPanelPrice.night']()}</span>

	{#if hasNightlyDiscount(accommodation)}
		<span class="text-sm text-muted-foreground line-through">
			{formatCurrency(accommodation.pricePerNight)}
		</span>
	{/if}
</div>
