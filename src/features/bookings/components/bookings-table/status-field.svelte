<script lang="ts">
	// COMPONENTS
	import BookingsStatus from '../bookings-status.svelte';

	// TYPES
	import type { typesBookingSafe } from '@/shared/features/booking/types/bookingTypes';

	let { booking }: { booking: typesBookingSafe } = $props();
</script>

<BookingsStatus kind="booking" status={booking.status} showHelp={false} />
