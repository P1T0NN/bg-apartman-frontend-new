<script lang="ts">
	// I18N
	import { m } from '@/paraglide/messages';

	// COMPONENTS
	import BookingCalendar from '@/components/pages/(unprotected)/accommodation/accommodation-booking-panel/booking-calendar.svelte';
	import GuestStepper from '@/components/pages/(unprotected)/accommodation/accommodation-booking-panel/guest-stepper.svelte';
	import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
	import BookDetailsStayRules from './book-details-stay-rules.svelte';

	// TYPES
	import type { DateRange } from 'bits-ui';
	import type { typesAccommodationEnriched } from '@/shared/features/accommodation/types/accommodationTypes';

	let {
		accommodation,
		dateRange = $bindable<DateRange>({ start: undefined, end: undefined }),
		adults = $bindable(1),
		children = $bindable(0)
	}: {
		accommodation: typesAccommodationEnriched;
		dateRange?: DateRange;
		adults?: number;
		children?: number;
	} = $props();
</script>

<section class="space-y-8">
	<Card>
		<CardHeader>
			<CardTitle>{m['BookPage.BookDetails.yourDates']()}</CardTitle>
		</CardHeader>
		<CardContent class="space-y-4">
			<BookingCalendar
				{accommodation}
				bind:dateRange
				numberOfMonths={2}
				showPolicy={false}
				class="w-fit"
			/>

			<BookDetailsStayRules {accommodation} />
		</CardContent>
	</Card>

	<Card>
		<CardHeader>
			<CardTitle>{m['BookPage.BookDetails.guests']()}</CardTitle>
		</CardHeader>
		<CardContent>
			<GuestStepper maxGuests={accommodation.maxGuests} bind:adults bind:children />
		</CardContent>
	</Card>
</section>
