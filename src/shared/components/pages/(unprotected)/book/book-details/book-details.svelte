<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';

	// COMPONENTS
	import BookingCalendar from '@/shared/components/pages/(unprotected)/accommodation/accommodation-booking-panel/booking-calendar.svelte';
	import GuestStepper from '@/shared/components/pages/(unprotected)/accommodation/accommodation-booking-panel/guest-stepper.svelte';
	import BookDetailsStayRules from './book-details-stay-rules.svelte';

	// TYPES
	import type { DateRange } from 'bits-ui';
	import type { typesAccommodationEnriched } from '@/shared/features/accommodation/types/accommodationTypes';

	let {
		accommodation,
		dateRange = $bindable<DateRange>({ start: undefined, end: undefined }),
		adults = $bindable(2),
		children = $bindable(0)
	}: {
		accommodation: typesAccommodationEnriched;
		dateRange?: DateRange;
		adults?: number;
		children?: number;
	} = $props();
</script>

<section class="space-y-8">
	<div class="space-y-4">
		<h2 class="text-lg font-semibold tracking-tight">{m['BookAccommodationPage.BookDetails.yourDates']()}</h2>

		<BookingCalendar
			{accommodation}
			bind:dateRange
			numberOfMonths={2}
			showPolicy={false}
			class="w-fit rounded-xl border"
		/>

		<BookDetailsStayRules {accommodation} />
	</div>

	<div class="space-y-3">
		<h2 class="text-lg font-semibold tracking-tight">{m['BookAccommodationPage.BookDetails.guests']()}</h2>
		<div class="rounded-xl border p-4">
			<GuestStepper maxGuests={accommodation.maxGuests} bind:adults bind:children />
		</div>
	</div>
</section>
