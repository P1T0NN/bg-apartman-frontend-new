<script lang="ts">
	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// LUCIDE ICONS
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';

	// TYPES
	import type { typesBookingSafe } from '@/shared/features/booking/types/bookingTypes';

	// The table's detail-sheet state, bound straight through: this cell is one of the two
	// places a row opens from, so it does the opening itself.
	let {
		booking,
		selected = $bindable(null),
		open = $bindable(false)
	}: {
		booking: typesBookingSafe;
		selected?: typesBookingSafe | null;
		open?: boolean;
	} = $props();

	function openDetail() {
		selected = booking;
		open = true;
	}
</script>

<Button
	variant="ghost"
	size="icon-sm"
	class="ml-auto text-muted-foreground"
	aria-label={`View booking ${booking.bookingCode}`}
	onclick={openDetail}
>
	<ChevronRightIcon />
</Button>
