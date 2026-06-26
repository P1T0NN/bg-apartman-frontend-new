<script lang="ts">
	// COMPONENTS
	import SvelteHead from '@/shared/components/ui/svelte-head/svelte-head.svelte';
	import BookingsHeader from '@/shared/components/pages/(protected)/bookings/bookings-header.svelte';
	import BookingsStats from '@/shared/components/pages/(protected)/bookings/bookings-stats.svelte';
	import BookingsTable from '@/shared/components/pages/(protected)/bookings/bookings-table.svelte';

	// DATA
	import { BOOKING_FILTERS } from '@/features/bookings/data/bookingsData';
	import { bookingsDummyData } from '@/features/bookings/data/bookingsDummyData';

	// UTILS
	import { createTabComponentState } from '@/shared/components/ui/tab-component/tab-component.svelte.js';

	// TYPES
	import type { BookingRecord } from '@/features/bookings/data/bookingsDummyData';
	import type { BookingFilter } from '@/features/bookings/types/bookingsTypes';

	// Guest-facing demo: bookings tied to a guest profile in the fixture set.
	const bookings = $derived<BookingRecord[]>(
		bookingsDummyData.filter((booking) => booking.guestId !== undefined)
	);

	// Dashboard shortcuts land with ?status=confirmed / ?status=checked_out — keep the
	// filter pill control and the URL in sync via nuqs (same pattern as TabComponent).
	const statusFilter = createTabComponentState(() => ({
		tabs: BOOKING_FILTERS,
		queryKey: 'status',
		defaultValue: 'all' as BookingFilter,
		options: { history: 'replace', shallow: true, scroll: false, clearOnDefault: true }
	}));

	function setStatusFilter(filter: BookingFilter) {
		void statusFilter.state.set(filter, statusFilter.options);
	}
</script>

<SvelteHead title="My bookings" description="Your trips, reservations and past stays." noIndex />

<section class="flex w-full flex-col gap-6 p-4 md:p-6">
	<BookingsHeader
		title="My bookings"
		description="Track your upcoming trips, review past stays and check the status of every reservation."
	/>

	<BookingsStats {bookings} />

	<BookingsTable
		{bookings}
		activeFilter={statusFilter.state.current}
		onFilterChange={setStatusFilter}
	/>
</section>
