<script lang="ts">
	// TYPES
	import type { typesBookingSafe } from '@/shared/features/booking/types/bookingTypes';

	let { booking }: { booking: typesBookingSafe } = $props();

	const guestCount = $derived(booking.numberOfAdults + booking.numberOfChildren);
</script>

<span class="text-sm text-muted-foreground whitespace-nowrap">
	{guestCount}
	{guestCount === 1 ? 'guest' : 'guests'}
</span>
