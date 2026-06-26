<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';
	import { localizeHref } from '@/shared/lib/paraglide/runtime';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants';

	// COMPONENTS
	import { Button } from '@/shared/components/ui/button/index.js';

	// UTILS
	import { effectiveNightlyPrice } from '@/shared/features/pricing/utils/calculatePrice';
	import { formatCurrency } from '@/shared/utils/formatters';

	// TYPES
	import type { AccommodationDetail } from '@/features/accommodations/data/accommodationDummyData';

	let { accommodation }: { accommodation: AccommodationDetail } = $props();

	const nightly = $derived(effectiveNightlyPrice(accommodation));
	const bookHref = $derived(
		localizeHref(UNPROTECTED_PAGE_ENDPOINTS.BOOK_ACCOMMODATION.replace(':slug', accommodation.slug))
	);
</script>

<div
	class="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 border-t bg-background/95 px-4 py-3 backdrop-blur lg:hidden"
>
	<p class="text-sm">
		<span class="text-muted-foreground">{m['AccommodationPage.BookingPanelPrice.from']()}</span>
		<span class="font-semibold">{formatCurrency(nightly)}</span>
		<span class="text-muted-foreground">{m['AccommodationPage.BookingPanelPrice.night']()}</span>
	</p>

	<Button href={bookHref} size="lg" class="h-11 shrink-0 px-6">
		{m['AccommodationPage.AccommodationBookingPanel.checkAvailability']()}
	</Button>
</div>
