<script lang="ts">
	// COMPONENTS
	import BookingCalendar from '@/shared/components/pages/(unprotected)/accommodation/accommodation-booking-panel/booking-calendar.svelte';
	import GuestStepper from '@/shared/components/pages/(unprotected)/accommodation/accommodation-booking-panel/guest-stepper.svelte';
	import { Alert, AlertTitle, AlertDescription } from '@/shared/components/ui/alert/index.js';

	// UTILS
	import { formatNights } from '@/shared/utils/formatters';
	import { minNightsFor } from '@/features/accommodations/utils/accommodationPresentation';

	// LUCIDE ICONS
	import InfoIcon from '@lucide/svelte/icons/info';
	import CalendarRangeIcon from '@lucide/svelte/icons/calendar-range';
	import ClockIcon from '@lucide/svelte/icons/clock';

	// TYPES
	import type { DateRange } from 'bits-ui';
	import type { AccommodationDetail } from '@/features/accommodations/data/accommodationDummyData';

	let {
		accommodation,
		dateRange = $bindable<DateRange>({ start: undefined, end: undefined }),
		adults = $bindable(2),
		children = $bindable(0)
	}: {
		accommodation: AccommodationDetail;
		dateRange?: DateRange;
		adults?: number;
		children?: number;
	} = $props();

	const minNights = $derived(minNightsFor(accommodation));
</script>

<section class="space-y-8">
	<div class="space-y-4">
		<h2 class="text-lg font-semibold tracking-tight">Your dates</h2>

		<BookingCalendar
			{accommodation}
			bind:dateRange
			numberOfMonths={2}
			showPolicy={false}
			class="w-fit rounded-xl border"
		/>

		<!-- Stay rules pulled out of the calendar card and explained as a low-load note. -->
		<Alert>
			<InfoIcon />
			<AlertTitle>Before you book</AlertTitle>
			<AlertDescription>
				<ul class="mt-1 space-y-1.5">
					<li class="flex items-center gap-2">
						<CalendarRangeIcon class="size-3.5 shrink-0 opacity-70" aria-hidden="true" />
						Minimum stay of {formatNights(minNights)}
					</li>
					<li class="flex items-center gap-2">
						<ClockIcon class="size-3.5 shrink-0 opacity-70" aria-hidden="true" />
						{accommodation.sameDayReservation
							? 'Same-day check-in is available'
							: "Same-day check-in isn't available — pick a start date at least a day ahead"}
					</li>
				</ul>
			</AlertDescription>
		</Alert>
	</div>

	<div class="space-y-3">
		<h2 class="text-lg font-semibold tracking-tight">Guests</h2>
		<div class="rounded-xl border p-4">
			<GuestStepper maxGuests={accommodation.maxGuests} bind:adults bind:children />
		</div>
	</div>
</section>
