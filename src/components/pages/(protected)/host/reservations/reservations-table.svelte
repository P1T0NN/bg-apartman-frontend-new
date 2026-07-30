<script lang="ts">
	// SVELTEKIT IMPORTS
	import { untrack } from 'svelte';

	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useQuery } from 'convex-svelte';
	import { useQueryState } from 'nuqs-svelte';

	// COMPONENTS
	import { ErrorComponent } from '@/components/ui/error-component/index.js';
	import BookingsTable from '@/features/bookings/components/bookings-table/bookings-table.svelte';
	import HostBookingsDetailSheet from '@/features/bookings/components/bookings-table/bookings-detail-sheet/host-bookings-detail-sheet.svelte';

	// TYPES
	import type { Id } from '@/convex/_generated/dataModel';
	import type { typesBookingSafe } from '@/shared/features/booking/types/bookingTypes';

	/**
	 * The whole reservations surface: the table and the ONE detail sheet (which brings its own
	 * action dialogs). Self-contained so the page file stays a header plus this.
	 *
	 * The sheet is rendered here, not inside `BookingsTable`, so that every way of opening a
	 * booking — a row click, the `?booking=` deep link, whatever comes next — writes the same
	 * `selected` / `sheetOpen` pair instead of mounting a second sheet of its own.
	 */
	let selected = $state<typesBookingSafe | null>(null);
	let sheetOpen = $state(false);

	// `?booking=<id>` opens that reservation straight away — the address a calendar's booked
	// night and (later) a host email link to (HostSystemDesign.md §4/§6).
	//
	// This is a SECOND subscription alongside the table's list query, and Convex does not
	// merge them: subscriptions are keyed by (function, args), so only an identical call
	// would share one. It still earns its place — the table is filtered and paginated, so
	// the deep-linked booking usually isn't in the page it holds, and reading it off the
	// list would fail exactly when someone follows a link. Cost is one by-id subscription,
	// live only while `?booking=` is set ('skip' otherwise).
	const focus = useQueryState('booking');
	const focusQuery = useQuery(
		api.tables.bookings.queries.fetchHostBookingSafe.fetchHostBookingSafe,
		() => (focus.current ? { bookingId: focus.current as Id<'bookings'> } : 'skip')
	);
	const focusBooking = $derived((focusQuery.data ?? null) as typesBookingSafe | null);

	// The URL is just another way of selecting a row: it writes exactly what a row click
	// writes. Only ever opens — closing is the sheet's job below.
	//
	// `untrack` keeps `focusBooking` as the effect's ONLY dependency: closing the sheet must
	// not re-run this (it would resurrect the sheet), and the guard exists for one race — the
	// host clicks a row while a slower `?booking=` fetch is still in flight; the late arrival
	// must not swap the open sheet's content. Same booking is let through so a live update
	// (guest withdraws mid-stare) still refreshes the sheet.
	$effect(() => {
		if (!focusBooking) return;

		const otherBookingShown = untrack(
			() => sheetOpen && selected !== null && selected._id !== focusBooking._id
		);
		if (otherBookingShown) return;

		selected = focusBooking;
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
	bind:selected
	bind:sheetOpen
	defaultFilter="pending"
	{errorContent}
/>

{#snippet errorContent()}
	<ErrorComponent
		variant="alert"
		title="Couldn't load reservations"
		description="Something went wrong while loading your reservations. Please try again."
	/>
{/snippet}

<HostBookingsDetailSheet
	booking={selected}
	bind:open={sheetOpen}
	onOpenChange={onSheetOpenChange}
/>
