<script lang="ts">
	// I18N
	import { m } from '@/paraglide/messages';

	// LIBRARIES
	import { api } from '@/convex/_generated/api';

	// COMPONENTS
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import MyBookingsHeader from '@/components/pages/(protected)/guest/my-bookings/my-bookings-header.svelte';
	import { ErrorComponent } from '@/components/ui/error-component/index.js';
	import BookingsTable from '@/features/bookings/components/bookings-table/bookings-table.svelte';
	import BookingsDetailSheet from '@/features/bookings/components/bookings-table/bookings-detail-sheet/bookings-detail-sheet.svelte';

	// TYPES
	import type { Id } from '@/convex/_generated/dataModel';

	// The table reports which row was picked (by id); the sheet renders it, fetching the live
	// row itself. No `onAction` — a guest reads their own booking here, they don't act on it.
	let selectedId = $state<Id<'bookings'> | null>(null);
	let sheetOpen = $state(false);
</script>

<SvelteHead title={m['GuestMyBookingsPage.SEO.title']()} description={m['GuestMyBookingsPage.SEO.description']()} noIndex />

<section class="flex w-full flex-col gap-6 p-4 md:p-6">
	<MyBookingsHeader />

	<BookingsTable
		query={api.tables.bookings.queries.fetchMyBookingsSafe.fetchMyBookingsSafe}
		bind:selectedId
		bind:sheetOpen
		{errorContent}
	/>
</section>

<BookingsDetailSheet bookingId={selectedId} bind:open={sheetOpen} />

{#snippet errorContent()}
	<ErrorComponent
		variant="alert"
		title={m['GuestMyBookingsPage.loadBookingsErrorTitle']()}
		description={m['GuestMyBookingsPage.loadBookingsErrorDescription']()}
	/>
{/snippet}
