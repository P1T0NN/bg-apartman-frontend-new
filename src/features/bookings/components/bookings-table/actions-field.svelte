<script lang="ts">
	// COMPONENTS
	import { Button } from '@/shared/components/ui/button/index.js';

	// LUCIDE ICONS
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';

	// TYPES
	import type { typesBookingSafe } from '@/shared/features/booking/types/bookingTypes';

	let {
		booking,
		onSelect
	}: {
		booking: typesBookingSafe;
		onSelect: () => void;
	} = $props();
</script>

<Button
	variant="ghost"
	size="icon-sm"
	class="ml-auto text-muted-foreground"
	aria-label={`View booking ${booking.bookingCode}`}
	onclick={onSelect}
>
	<ChevronRightIcon />
</Button>
