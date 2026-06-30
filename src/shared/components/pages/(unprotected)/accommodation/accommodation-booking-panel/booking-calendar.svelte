<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';

	// CONFIG
	import { DEFAULT_TIME_ZONE } from '@/shared/config';

	// COMPONENTS
	import {
		AvailabilityCalendar,
		AvailabilityCalendarLegend,
		type AvailabilityRange
	} from '@/shared/components/ui/availability-calendar/index.js';
	import { toast } from 'svelte-sonner';
	import SameDayDisplay from '@/features/accommodations/components/same-day-display.svelte';
	import SingleStayDisplay from '@/features/accommodations/components/single-stay-display.svelte';

	// UTILS
	import { formatNights } from '@/utils/formatters';
	import { minNightsFor } from '@/features/accommodations/utils/accommodationPresentation';
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { DateRange } from 'bits-ui';
	import type { typesAccommodationEnriched } from '@/shared/features/accommodation/types/accommodationTypes';

	let {
		accommodation,
		dateRange = $bindable<DateRange>({ start: undefined, end: undefined }),
		numberOfMonths = 1,
		showPolicy = true,
		onValueChange,
		class: className
	}: {
		accommodation: typesAccommodationEnriched;
		dateRange?: DateRange;
		numberOfMonths?: number;
		/** Render the stay-policy footer (min stay / same-day / single-night) inside the card.
		    Off when the consumer shows its own policy note below the calendar. */
		showPolicy?: boolean;
		onValueChange?: (value: DateRange) => void;
		class?: string;
	} = $props();

	// The apartment's local day — not the viewer's — drives the calendar. The calendar
	// derives its own min ("today" in this zone) from `timeZone`, so no minValue needed.
	const tz = $derived(accommodation.timeZone || DEFAULT_TIME_ZONE);

	const availabilityRanges = $derived<AvailabilityRange[]>(
		accommodation.bookedRanges.map((range) => ({
			start: range.start,
			end: range.end,
			status: 'booked'
		}))
	);

	const minNights = $derived(minNightsFor(accommodation));
</script>

<div class={cn('overflow-hidden', className)}>
	<AvailabilityCalendar
		bind:value={dateRange}
		ranges={availabilityRanges}
		timeZone={tz}
		allowToday={accommodation.sameDayReservation}
		{minNights}
		maxNights={accommodation.maxReservationDays}
		{numberOfMonths}
		class="border-0"
		onInvalidSelection={(message) => toast.error(message)}
		{onValueChange}
	/>

	<!-- w-0 min-w-full: wrap the legend to the calendar's width instead of stretching the container. -->
	<AvailabilityCalendarLegend
		variant="guest"
		allowToday={accommodation.sameDayReservation}
		class="w-0 min-w-full border-t px-3 py-2"
	/>

	{#if showPolicy}
		<div class="space-y-1 border-t px-3 py-2 text-center text-xs text-muted-foreground">
			<p>{m['BookAccommodationPage.BookingCalendar.minimumStay']({ nights: formatNights(minNights) })}</p>
			<SameDayDisplay enabled={accommodation.sameDayReservation} />
			<SingleStayDisplay allowed={minNights <= 1} />
		</div>
	{/if}
</div>
