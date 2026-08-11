<script lang="ts">
	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/config/routeEndpoints';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import BookingPanelPrice from './booking-panel-price.svelte';
	import BookingPanelFacts from './booking-panel-facts.svelte';
	import BookingPanelFooter from './booking-panel-footer.svelte';

	// TYPES
	import type { typesAccommodationEnriched } from '@/shared/features/accommodation/types/accommodationTypes';

	let { accommodation }: { accommodation: typesAccommodationEnriched } = $props();

	// Dates + guests are chosen on the book page now; this box is just the entry point.
	const bookHref = $derived(
		UNPROTECTED_PAGE_ENDPOINTS.BOOK_ACCOMMODATION.replace(':slug', accommodation.slug)
	);
</script>

<div class="space-y-4">
	<BookingPanelPrice {accommodation} />

	<BookingPanelFacts {accommodation} />

	<Button href={bookHref} size="lg" class="h-11 w-full text-base">Check availability</Button>

	<p class="text-center text-xs text-muted-foreground">You won’t be charged yet</p>

	<BookingPanelFooter
		instantBooking={accommodation.instantBooking}
		paymentMethod={accommodation.paymentMethod}
	/>
</div>
