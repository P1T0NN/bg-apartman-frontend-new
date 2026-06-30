<script lang="ts">
	// UTILS
	import { formatCurrency } from '@/utils/formatters';

	// TYPES
	import type { typesBookingSafe } from '@/shared/features/booking/types/bookingTypes';

	let { booking }: { booking: typesBookingSafe } = $props();
</script>

<span class="text-sm font-semibold tabular-nums">{formatCurrency(booking.total)}</span>
