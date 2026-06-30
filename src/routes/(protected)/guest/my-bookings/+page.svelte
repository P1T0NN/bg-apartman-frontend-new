<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useQuery } from 'convex-svelte';

	// CONFIG
	import { PAGINATION_DATA } from '@/shared/config';

	// COMPONENTS
	import SvelteHead from '@/shared/components/ui/svelte-head/svelte-head.svelte';
	import MyBookingsHeader from '@/shared/components/pages/(protected)/guest/my-bookings/my-bookings-header.svelte';
	import MyBookingsStats from '@/shared/components/pages/(protected)/guest/my-bookings/my-bookings-stats/my-bookings-stats.svelte';
	import MyBookingsPageError from '@/shared/components/pages/(protected)/guest/my-bookings/error/my-bookings-page-error.svelte';
	import BookingsTable from '@/features/bookings/components/bookings-table/bookings-table.svelte';

	const myBookingsQuery = useQuery(
		api.tables.bookings.queries.fetchMyBookingsSafe.fetchMyBookingsSafe,
		() => ({
			page: 1,
			paginationOpts: {
				numItems: PAGINATION_DATA.DEFAULT_PAGE_SIZE,
				cursor: null
			}
		})
	);

	const bookings = $derived(myBookingsQuery.data?.page ?? []);
	const isLoading = $derived(myBookingsQuery.data === undefined && !myBookingsQuery.error);
</script>

<SvelteHead
	title="My bookings"
	description="Your trips, reservations and past stays."
	noIndex
/>

<section class="flex w-full flex-col gap-6 p-4 md:p-6">
	<MyBookingsHeader />

	{#if myBookingsQuery.error}
		<MyBookingsPageError />
	{:else}
		<MyBookingsStats {bookings} {isLoading} />
		<BookingsTable {bookings} {isLoading} />
	{/if}
</section>
