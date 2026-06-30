<script lang="ts">
	// TYPES
	import type { typesBookingSafe } from '@/shared/features/booking/types/bookingTypes';

	let { booking }: { booking: typesBookingSafe } = $props();
</script>

<div class="flex min-w-0 items-center gap-2.5">
	<img
		src={booking.apartment.imageUrl}
		alt={booking.apartment.title}
		class="size-9 shrink-0 rounded-md object-cover ring-1 ring-border"
		loading="lazy"
	/>
	<div class="min-w-0">
		<p class="truncate text-sm font-medium">{booking.apartment.title}</p>
		<p class="truncate text-xs text-muted-foreground">{booking.apartment.city}</p>
	</div>
</div>
