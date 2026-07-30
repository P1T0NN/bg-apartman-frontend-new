<script lang="ts">
	// UTILS
	import { initials } from '@/shared/utils/stringUtils';

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

	const name = $derived(`${booking.guestFirstName} ${booking.guestLastName}`);

	function openDetail() {
		selected = booking;
		open = true;
	}
</script>

<button
	type="button"
	onclick={openDetail}
	class="group/guest flex w-full items-center gap-3 text-left"
>
	<span
		class="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground ring-1 ring-border"
		aria-hidden="true"
	>
		{initials(name)}
	</span>
	<span class="min-w-0">
		<span class="block truncate text-sm font-medium group-hover/guest:underline">{name}</span>
		<span class="block truncate font-mono text-xs text-muted-foreground">{booking.bookingCode}</span
		>
	</span>
</button>
