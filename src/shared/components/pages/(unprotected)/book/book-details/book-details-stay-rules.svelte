<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';

	// COMPONENTS
	import { Alert, AlertTitle, AlertDescription } from '@/shared/components/ui/alert/index.js';

	// UTILS
	import { formatNights } from '@/utils/formatters';
	import { minNightsFor } from '@/features/accommodations/utils/accommodationPresentation';

	// TYPES
	import type { typesAccommodationEnriched } from '@/shared/features/accommodation/types/accommodationTypes';

	// LUCIDE ICONS
	import InfoIcon from '@lucide/svelte/icons/info';
	import CalendarRangeIcon from '@lucide/svelte/icons/calendar-range';
	import ClockIcon from '@lucide/svelte/icons/clock';

	let { accommodation }: { accommodation: typesAccommodationEnriched } = $props();

	const minNights = $derived(minNightsFor(accommodation));
</script>

<!-- Stay rules pulled out of the calendar card and explained as a low-load note. -->
<Alert>
	<InfoIcon />
	<AlertTitle>Before you book</AlertTitle>
	<AlertDescription>
		<ul class="mt-1 space-y-1.5">
			<li class="flex items-center gap-2">
				<CalendarRangeIcon class="size-3.5 shrink-0 opacity-70" aria-hidden="true" />
				{m['BookAccommodationPage.BookDetailsStayRules.minimumStay']({
					nights: formatNights(minNights)
				})}
			</li>
			<li class="flex items-center gap-2">
				<ClockIcon class="size-3.5 shrink-0 opacity-70" aria-hidden="true" />
				{#if accommodation.sameDayReservation}
					{m['BookAccommodationPage.BookDetailsStayRules.sameDayCheckInAvailable']()}
				{:else}
					{m['BookAccommodationPage.BookDetailsStayRules.sameDayCheckInNotAvailable']()}
				{/if}
			</li>
		</ul>
	</AlertDescription>
</Alert>
