<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';

	// COMPONENTS
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import MyBookingsHeader from '@/components/pages/(protected)/guest/my-bookings/my-bookings-header.svelte';
	import { ErrorComponent } from '@/components/ui/error-component/index.js';
	import BookingsTable from '@/features/bookings/components/bookings-table/bookings-table.svelte';
	import BookingsDetailSheet from '@/features/bookings/components/bookings-table/bookings-detail-sheet/bookings-detail-sheet.svelte';

	// TYPES
	import type { typesBookingSafe } from '@/shared/features/booking/types/bookingTypes';

	// The table reports which row was picked; the sheet renders it. No `onAction` — a guest
	// reads their own booking here, they don't act on it.
	let selected = $state<typesBookingSafe | null>(null);
	let sheetOpen = $state(false);
</script>

<SvelteHead title="My bookings" description="Your trips, reservations and past stays." noIndex />

<section class="flex w-full flex-col gap-6 p-4 md:p-6">
	<MyBookingsHeader />

	<BookingsTable
		query={api.tables.bookings.queries.fetchMyBookingsSafe.fetchMyBookingsSafe}
		bind:selected
		bind:sheetOpen
		{errorContent}
	/>
</section>

<BookingsDetailSheet booking={selected} bind:open={sheetOpen} />

{#snippet errorContent()}
	<ErrorComponent
		variant="alert"
		title="Couldn't load your bookings"
		description="Something went wrong while loading your reservations. Please try again in a moment."
	/>
{/snippet}
