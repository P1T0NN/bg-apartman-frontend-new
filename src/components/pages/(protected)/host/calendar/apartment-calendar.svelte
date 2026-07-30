<script lang="ts">
	// SVELTEKIT
	import { goto } from '$app/navigation';

	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { toast } from 'svelte-sonner';
	import type { DateValue } from '@internationalized/date';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import {
		AvailabilityCalendar,
		AvailabilityCalendarLegend,
		type AvailabilityCalendarSelection,
		type AvailabilityRange
	} from '@/components/ui/availability-calendar/index.js';

	// CONFIG
	import { DEFAULT_TIME_ZONE } from '@/shared/config';
	import { PROTECTED_PAGE_ENDPOINTS } from '@/config/routeEndpoints';

	// UTILS
	import { safeMutation } from '@/utils/convexHelpers';
	import { toastResult } from '@/utils/toastResult';

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

	const convex = useConvexClient();

	// Subscribed: bookings land from other people while the host edits blocks, and this same
	// screen mutates what it displays (HostSystemDesign.md §2).
	const calendarQuery = useQuery(
		api.tables.apartmentBlocks.queries.fetchApartmentCalendarSafe.fetchApartmentCalendarSafe,
		() => ({ apartmentId })
	);

	const availabilityRanges = $derived<AvailabilityRange[]>(calendarQuery.data ?? []);

	let value = $state<DateRange>({ start: undefined, end: undefined });
	let pending = $state(false);

	function sortRange(start: DateValue, end: DateValue): [DateValue, DateValue] {
		return start.compare(end) <= 0 ? [start, end] : [end, start];
	}

	/**
	 * The calendar selects whole days inclusively; the backend speaks half-open night ranges
	 * (`end` = checkout day). One `+1 day` here is the only place the two meet.
	 */
	function toNightRange(
		selection: AvailabilityCalendarSelection
	): { startDate: string; endDate: string } | null {
		if (!selection.start) return null;
		const [start, end] = sortRange(selection.start, selection.end ?? selection.start);
		return { startDate: start.toString(), endDate: end.add({ days: 1 }).toString() };
	}

	async function runCalendarAction(
		selection: AvailabilityCalendarSelection,
		action: 'block' | 'unblock'
	) {
		const range = toNightRange(selection);
		if (!range) return;

		pending = true;
		try {
			const result = await safeMutation(
				convex,
				action === 'block'
					? api.tables.apartmentBlocks.mutations.apartmentBlockMutations.blockApartmentDates
					: api.tables.apartmentBlocks.mutations.apartmentBlockMutations.unblockApartmentDates,
				{ apartmentId, ...range }
			);
			if (toastResult(result)) selection.clearSelection();
		} finally {
			pending = false;
		}
	}
</script>

<!--
	The one question this screen answers: is a night free or not (HostSystemDesign.md §4).
	No pricing, no request management, no metadata on blocks — a block exists or it doesn't.
	Pending requests deliberately do NOT paint here: they block nothing until confirmed
	(BookingSystemDesign.md §6), and showing them would teach the wrong model.
-->
<div class="flex flex-col gap-5">
	<!-- Legend -->
	<AvailabilityCalendarLegend variant="host" />

	{#if calendarQuery.error}
		<p class="text-sm text-destructive">Could not load this calendar. Refresh to try again.</p>
	{:else}
		<AvailabilityCalendar
			bind:value
			ranges={availabilityRanges}
			{timeZone}
			onInvalidSelection={(message) => toast.error(message)}
			onBookedClick={(bookingId) =>
				goto(`${PROTECTED_PAGE_ENDPOINTS.RESERVATIONS}?booking=${bookingId}`)}
		>
			{#snippet selectionActions(selection: AvailabilityCalendarSelection)}
				<Button variant="ghost" size="sm" disabled={pending} onclick={selection.clearSelection}>
					<XIcon class="size-4" aria-hidden="true" />
					Clear
				</Button>

				<Button
					variant="outline"
					size="sm"
					disabled={pending}
					onclick={() => runCalendarAction(selection, 'unblock')}
				>
					<CalendarCheckIcon class="size-4" aria-hidden="true" />
					Unblock
				</Button>

				<Button
					variant="destructive"
					size="sm"
					disabled={pending}
					onclick={() => runCalendarAction(selection, 'block')}
				>
					<BanIcon class="size-4" aria-hidden="true" />
					Block
				</Button>
			{/snippet}
		</AvailabilityCalendar>
	{/if}
</div>
