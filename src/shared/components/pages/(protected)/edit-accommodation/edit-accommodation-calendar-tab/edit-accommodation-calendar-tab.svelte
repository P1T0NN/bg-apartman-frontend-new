<script lang="ts">
	// LIBRARIES
	import type { DateValue } from '@internationalized/date';

	// COMPONENTS
	import { Button } from '@/shared/components/ui/button/index.js';
	import {
		AvailabilityCalendar,
		AvailabilityCalendarLegend,
		type AvailabilityCalendarSelection,
		type AvailabilityRange
	} from '@/shared/components/ui/availability-calendar/index.js';
	import { toast } from 'svelte-sonner';

	// CONSTANTS
	import { DEFAULT_TIME_ZONE } from '@/shared/constants';

	// DATA
	import { bookingsDummyData } from '@/features/bookings/data/bookingsDummyData';

	// TYPES
	import type { Id } from '@/convex/_generated/dataModel';
	import type { DateRange } from 'bits-ui';

	// LUCIDE ICONS
	import BanIcon from '@lucide/svelte/icons/ban';
	import CalendarCheckIcon from '@lucide/svelte/icons/calendar-check';
	import XIcon from '@lucide/svelte/icons/x';

	let {
		apartmentId,
		timeZone = DEFAULT_TIME_ZONE
	}: {
		apartmentId: Id<'apartments'>;
		timeZone?: string;
	} = $props();

	const bookedRanges = $derived<AvailabilityRange[]>(
		bookingsDummyData
			.filter(
				(booking) =>
					booking.apartmentId === String(apartmentId) && booking.status !== 'cancelled'
			)
			.map((booking) => ({
				start: booking.checkInDate,
				end: booking.checkOutDate,
				status: 'booked' as const
			}))
	);

	let value = $state<DateRange>({ start: undefined, end: undefined });
	let blockedRanges = $state<AvailabilityRange[]>([]);

	const availabilityRanges = $derived([...bookedRanges, ...blockedRanges]);

	function sortRange(start: DateValue, end: DateValue): [DateValue, DateValue] {
		return start.compare(end) <= 0 ? [start, end] : [end, start];
	}

	function selectedDates(selection: AvailabilityCalendarSelection): DateValue[] {
		if (!selection.start) return [];

		const [start, end] = sortRange(selection.start, selection.end ?? selection.start);
		const dates: DateValue[] = [];
		let cursor = start;

		while (cursor.compare(end) <= 0) {
			dates.push(cursor);
			cursor = cursor.add({ days: 1 });
		}

		return dates;
	}

	function selectedDateKeys(selection: AvailabilityCalendarSelection): Set<string> {
		return new Set(selectedDates(selection).map((date) => date.toString()));
	}

	function blockDates(selection: AvailabilityCalendarSelection) {
		const existingBlockedKeys = new Set(blockedRanges.map((range) => range.start.toString()));
		const nextBlockedRanges = selectedDates(selection)
			.filter((date) => !existingBlockedKeys.has(date.toString()))
			.map((date) => ({
				start: date.toString(),
				end: date.add({ days: 1 }).toString(),
				status: 'blocked' as const
			}));

		if (nextBlockedRanges.length === 0) {
			toast.info('Those dates are already blocked.');
			selection.clearSelection();
			return;
		}

		blockedRanges = [...blockedRanges, ...nextBlockedRanges];
		toast.success(
			`Blocked ${nextBlockedRanges.length} ${nextBlockedRanges.length === 1 ? 'day' : 'days'}.`
		);
		selection.clearSelection();
	}

	function unblockDates(selection: AvailabilityCalendarSelection) {
		const keysToUnblock = selectedDateKeys(selection);
		const previousBlockedCount = blockedRanges.length;

		blockedRanges = blockedRanges.filter((range) => !keysToUnblock.has(range.start.toString()));

		const unblockedCount = previousBlockedCount - blockedRanges.length;
		if (unblockedCount === 0) {
			toast.info('No locally blocked dates were selected.');
			selection.clearSelection();
			return;
		}

		toast.success(`Unblocked ${unblockedCount} ${unblockedCount === 1 ? 'day' : 'days'}.`);
		selection.clearSelection();
	}
</script>

<div class="flex flex-col gap-5">
	<!-- Header -->
	<div class="space-y-1">
		<h3 class="text-base font-semibold">Availability</h3>
		<p class="text-sm text-muted-foreground">
			Select dates to block or reopen them for booking. Dates already reserved by guests can't be
			changed here.
		</p>
	</div>

	<!-- Legend -->
	<AvailabilityCalendarLegend variant="host" />

	<AvailabilityCalendar
		bind:value
		ranges={availabilityRanges}
		{timeZone}
		onInvalidSelection={(message) => toast.error(message)}
	>
		{#snippet selectionActions(selection: AvailabilityCalendarSelection)}
			<Button variant="ghost" size="sm" onclick={selection.clearSelection}>
				<XIcon class="size-4" aria-hidden="true" />
				Clear
			</Button>

			<Button variant="outline" size="sm" onclick={() => unblockDates(selection)}>
				<CalendarCheckIcon class="size-4" aria-hidden="true" />
				Unblock
			</Button>

			<Button variant="destructive" size="sm" onclick={() => blockDates(selection)}>
				<BanIcon class="size-4" aria-hidden="true" />
				Block
			</Button>
		{/snippet}
	</AvailabilityCalendar>
</div>
