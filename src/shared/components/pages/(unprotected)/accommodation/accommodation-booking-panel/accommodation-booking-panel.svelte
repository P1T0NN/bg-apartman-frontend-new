<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';
	import { localizeHref } from '@/shared/lib/paraglide/runtime';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants';

	// COMPONENTS
	import { Button } from '@/shared/components/ui/button/index.js';
	import BookingPanelPrice from './booking-panel-price.svelte';
	import BookingPanelFooter from './booking-panel-footer.svelte';

	// TYPES
	import type { AccommodationDetail } from '@/features/accommodations/data/accommodationDummyData';

	let { accommodation }: { accommodation: AccommodationDetail } = $props();

	// Dates + guests are chosen on the book page now; this box is just the entry point.
	const bookHref = $derived(
		localizeHref(UNPROTECTED_PAGE_ENDPOINTS.BOOK_ACCOMMODATION.replace(':slug', accommodation.slug))
	);
</script>

<div class="space-y-4">
	<BookingPanelPrice {accommodation} />

	<Button href={bookHref} size="lg" class="h-11 w-full text-base">
		{m['AccommodationPage.AccommodationBookingPanel.checkAvailability']()}
	</Button>

	<p class="text-center text-xs text-muted-foreground">
		{m['AccommodationPage.AccommodationBookingPanel.youWillNotBeChargedYet']()}
	</p>

	<BookingPanelFooter
		instantBooking={accommodation.instantBooking}
		paymentMethod={accommodation.paymentMethod}
	/>
</div>
