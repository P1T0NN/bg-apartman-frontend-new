<script lang="ts">
    // LIBRARIES
    import { CalendarDate } from '@internationalized/date';

    // COMPONENTS
	import RangeCalendar from '@/shared/components/ui/range-calendar/range-calendar.svelte';

	// TYPES
	import type { DateRange } from 'bits-ui';

	let value = $state<DateRange>({
		start: new CalendarDate(2025, 6, 12),
		end: new CalendarDate(2025, 7, 15)
	});
</script>

<RangeCalendar bind:value class="rounded-lg border shadow-sm" numberOfMonths={2} />
