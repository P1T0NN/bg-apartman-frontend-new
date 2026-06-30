<script lang="ts">
	// UTILS
	import { formatDateShort, formatNights } from '@/utils/formatters';

	// TYPES
	import type { typesBookingSafe } from '@/shared/features/booking/types/bookingTypes';

	// LUCIDE ICONS
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';

	let { booking }: { booking: typesBookingSafe } = $props();
</script>

<div class="min-w-0">
	<p class="flex items-center gap-1.5 text-sm font-medium whitespace-nowrap">
		{formatDateShort(booking.checkInDate)}
		<ArrowRightIcon class="size-3.5 text-muted-foreground" aria-hidden="true" />
		{formatDateShort(booking.checkOutDate)}
	</p>
	<p class="text-xs text-muted-foreground">{formatNights(booking.numberOfNights)}</p>
</div>
