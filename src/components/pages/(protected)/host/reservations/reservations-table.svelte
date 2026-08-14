<script lang="ts">
	// I18N
	import { m } from '@/paraglide/messages';

	// SVELTEKIT IMPORTS
	import { untrack } from 'svelte';

	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useQueryState } from 'nuqs-svelte';

	// COMPONENTS
	import { ErrorComponent } from '@/components/ui/error-component/index.js';
	import BookingsTable from '@/features/bookings/components/bookings-table/bookings-table.svelte';
	import HostBookingsDetailSheet from '@/features/bookings/components/bookings-table/bookings-detail-sheet/host-bookings-detail-sheet.svelte';

	// TYPES
	import type { Id } from '@/convex/_generated/dataModel';

	/**
	 * The whole reservations surface: the table and the ONE detail sheet (which brings its own
	 * action dialogs). Self-contained so the page file stays a header plus this.
	 *
	 * The sheet is rendered here, not inside `BookingsTable`, so that every way of opening a
	 * booking — a row click, the `?booking=` deep link, whatever comes next — writes the same
	 * `selectedId` / `sheetOpen` pair instead of mounting a second sheet of its own. Only the
	 * id travels; the sheet fetches the live row itself, one by-id subscription while open.
	 */
	let selectedId = $state<Id<'bookings'> | null>(null);
	let sheetOpen = $state(false);

	// `?booking=<id>` opens that reservation straight away — the address a calendar's booked
	// night and (later) a host email link to (HostSystemDesign.md §4/§6). No query needed
	// here: the sheet owns the by-id fetch, so the id from the URL is all that's passed on.
	const focus = useQueryState('booking');

	// The URL is just another way of selecting a row: it writes exactly what a row click
	// writes. Only ever opens — closing is the sheet's job below.
	//
	// `untrack` keeps `focus.current` as the effect's ONLY dependency: closing the sheet must
	// not re-run this (it would resurrect the sheet), and the guard exists for one race — the
	// host clicks a row while a slower `?booking=` write is still in flight; the late arrival
	// must not swap the open sheet's content. Same booking is let through so a live update
	// (guest withdraws mid-stare) still refreshes the sheet.
	$effect(() => {
		if (!focus.current) return;

		const otherBookingShown = untrack(
			() => sheetOpen && selectedId !== null && selectedId !== focus.current
		);
		if (otherBookingShown) return;

		selectedId = focus.current as Id<'bookings'>;
		sheetOpen = true;
	});

	function onSheetOpenChange(open: boolean) {
		// Closing strips `?booking=` so a refresh (or a back-nav) doesn't pop the sheet open
		// again. null drops the param; nuqs replaces history by default.
		if (!open && focus.current) focus.current = null;
	}
</script>

<!-- Opens on the actionable slice, deadline-ascending (the server's host default sort) —
     the request closest to dying is row one (HostSystemDesign.md §3). -->
<BookingsTable
	query={api.tables.bookings.queries.fetchHostBookingsSafe.fetchHostBookingsSafe}
	bind:selectedId
	bind:sheetOpen
	defaultFilter="pending"
	{errorContent}
/>

{#snippet errorContent()}
	<ErrorComponent
		variant="alert"
		title={m['HostReservationsPage.ReservationsTable.errorTitle']()}
		description={m['HostReservationsPage.ReservationsTable.errorDescription']()}
	/>
{/snippet}

<HostBookingsDetailSheet
	bookingId={selectedId}
	bind:open={sheetOpen}
	onOpenChange={onSheetOpenChange}
/>
