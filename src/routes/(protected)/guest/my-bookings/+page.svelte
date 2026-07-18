<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';

	// COMPONENTS
	import SvelteHead from '@/shared/components/ui/svelte-head/svelte-head.svelte';
	import MyBookingsHeader from '@/shared/components/pages/(protected)/guest/my-bookings/my-bookings-header.svelte';
	import MyBookingsPageError from '@/shared/components/pages/(protected)/guest/my-bookings/error/my-bookings-page-error.svelte';
	import BookingsTable from '@/features/bookings/components/bookings-table/bookings-table.svelte';
</script>

<SvelteHead title="My bookings" description="Your trips, reservations and past stays." noIndex />

<section class="flex w-full flex-col gap-6 p-4 md:p-6">
	<MyBookingsHeader />

	<BookingsTable
		query={api.tables.bookings.queries.fetchMyBookingsSafe.fetchMyBookingsSafe}
		{errorContent}
	/>
</section>

{#snippet errorContent()}
	<MyBookingsPageError />
{/snippet}
