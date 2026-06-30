<script lang="ts">
	// LIBRARIES
	import { toast } from 'svelte-sonner';

	// COMPONENTS
	import SvelteHead from '@/shared/components/ui/svelte-head/svelte-head.svelte';
	import ReservationsHeader from '@/shared/components/pages/(protected)/host/reservations/reservations-header.svelte';
	import ReservationsStats from '@/shared/components/pages/(protected)/host/reservations/reservations-stats.svelte';
	import BookingsTable from '@/features/bookings/components/bookings-table/bookings-table.svelte';

	// DATA
	import { bookingsDummyData } from '@/features/bookings/data/bookingsDummyData';

	// UTILS
	import { actionToast, applyBookingAction } from '@/features/bookings/utils/bookingsPresentation';

	// TYPES
	import type { typesBookingSafe, typesBookingAction } from '@/shared/features/booking/types/bookingTypes';

	// Local, mutable copy of the fixture so host actions feel live without a backend.
	// Swap this for a Convex query once the bookings endpoints exist.
	let bookings = $state<typesBookingSafe[]>(bookingsDummyData.map((b) => ({ ...b })));

	function handleAction(booking: typesBookingSafe, action: typesBookingAction) {
		bookings = bookings.map((b) => (b._id === booking._id ? applyBookingAction(b, action) : b));
		toast.success(actionToast(action), {
			description: `${booking.guestFirstName} ${booking.guestLastName}`
		});
	}
</script>

<SvelteHead
	title="Reservations"
	description="Review booking requests, track upcoming stays and manage your guests."
	noIndex
/>

<section class="flex w-full flex-col gap-6 p-4 md:p-6">
	<ReservationsHeader />

	<ReservationsStats {bookings} />

	<BookingsTable 
		{bookings} 
		onAction={handleAction} 
	/>
</section>
