<script lang="ts">
	// I18N
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import DiscountedPrice from '@/shared/features/pricing/components/discounted-price.svelte';

	// UTILS
	import { effectiveNightlyPrice } from '@/shared/features/pricing/utils/calculatePrice';
	import { hasNightlyDiscount } from '@/features/accommodations/utils/accommodationPresentation';

	// TYPES
	import type { typesAccommodationEnriched } from '@/shared/features/accommodation/types/accommodationTypes';

	let { accommodation }: { accommodation: typesAccommodationEnriched } = $props();

	// Accommodation page shows a starting nightly price; the real total is on the book page.
	const nightly = $derived(effectiveNightlyPrice(accommodation));
	// Discounted price reads as the deal: current in green, the old price struck in destructive.
	const discounted = $derived(hasNightlyDiscount(accommodation));
</script>

<div class="flex flex-wrap items-baseline gap-x-1.5">
	<DiscountedPrice
		original={discounted ? accommodation.pricePerNight : null}
		price={nightly}
		strikeFirst={false}
		class="text-2xl"
	/>
	<span class="text-sm text-muted-foreground">{m['AccommodationPage.BookingPanelPrice.perNight']()}</span>
</div>
