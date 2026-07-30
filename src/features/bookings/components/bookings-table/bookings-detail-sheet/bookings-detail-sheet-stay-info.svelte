<script lang="ts">
	// COMPONENTS
	import { Separator } from '@/components/ui/separator/index.js';

	// UTILS
	import { formatAdultsAndChildren, formatDateWithWeekday, formatNights } from '@/utils/formatters';

	// TYPES
	import type { typesBookingSafe } from '@/shared/features/booking/types/bookingTypes';

	// LUCIDE ICONS
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import UsersIcon from '@lucide/svelte/icons/users';

	let { booking }: { booking: typesBookingSafe } = $props();
</script>

<section class="rounded-lg border bg-muted/30 p-3">
	<div class="flex items-center justify-between gap-2">
		<div>
			<p class="text-xs text-muted-foreground">Check-in</p>
			<p class="text-sm font-semibold">{formatDateWithWeekday(booking.checkInDate)}</p>
		</div>
		<div class="flex flex-col items-center text-muted-foreground">
			<span class="text-[0.7rem] whitespace-nowrap">{formatNights(booking.numberOfNights)}</span>
			<ArrowRightIcon class="size-4" aria-hidden="true" />
		</div>
		<div class="text-right">
			<p class="text-xs text-muted-foreground">Check-out</p>
			<p class="text-sm font-semibold">{formatDateWithWeekday(booking.checkOutDate)}</p>
		</div>
	</div>
	<Separator class="my-3" />
	<div class="flex items-center gap-2 text-sm text-muted-foreground">
		<UsersIcon class="size-4 shrink-0" aria-hidden="true" />
		<span>{formatAdultsAndChildren(booking.numberOfAdults, booking.numberOfChildren)}</span>
	</div>
</section>
