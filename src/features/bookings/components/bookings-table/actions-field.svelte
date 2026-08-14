<script lang="ts">
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// LUCIDE ICONS
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';

	// TYPES
	import type { Id } from '@/convex/_generated/dataModel';
	import type { typesBookingSafe } from '@/shared/features/booking/types/bookingTypes';

	// The table's detail-sheet state, bound straight through: this cell is one of the two
	// places a row opens from, so it does the opening itself. Only the id travels — the
	// sheet fetches the live row with its own by-id subscription.
	let {
		booking,
		selectedId = $bindable(null),
		open = $bindable(false)
	}: {
		booking: typesBookingSafe;
		selectedId?: Id<'bookings'> | null;
		open?: boolean;
	} = $props();

	function openDetail() {
		selectedId = booking._id;
		open = true;
	}
</script>

<Button
	variant="ghost"
	size="icon-sm"
	class="ml-auto text-muted-foreground"
	aria-label={m['BookingsFeature.BookingsTable.ActionsField.viewBooking']({ bookingCode: booking.bookingCode })}
	onclick={openDetail}
>
	<ChevronRightIcon />
</Button>
