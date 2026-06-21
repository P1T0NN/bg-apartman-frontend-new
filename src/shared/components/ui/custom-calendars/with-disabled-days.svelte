<script lang="ts">
    // LIBRARIES
    import { CalendarDate } from '@internationalized/date';

    // COMPONENTS
	import Calendar from '@/shared/components/ui/calendar/calendar.svelte';

	let value = $state<CalendarDate | undefined>(new CalendarDate(2025, 6, 12));
</script>

<Calendar
	type="single"
	bind:value
	class="rounded-lg border shadow-sm"
	minValue={new CalendarDate(2025, 6, 12)}
/>
