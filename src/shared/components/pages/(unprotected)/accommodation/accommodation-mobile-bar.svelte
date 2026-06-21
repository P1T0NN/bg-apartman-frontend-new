<script lang="ts">
	// LIBRARIES
	import { getLocalTimeZone } from '@internationalized/date';

	// COMPONENTS
	import {
		Sheet,
		SheetContent,
		SheetHeader,
		SheetTitle
	} from '@/shared/components/ui/sheet/index.js';
	import { Button } from '@/shared/components/ui/button/index.js';
	import AccommodationBookingPanel from './accommodation-booking-panel.svelte';

	// UTILS
	import {
		effectiveNightly,
		formatCurrency
	} from '@/features/accommodations/utils/accommodationPresentation';

	// TYPES
	import type { DateRange } from 'bits-ui';
	import type { AccommodationDetail } from '@/features/accommodations/data/accommodationDummyData';

	let {
		accommodation,
		dateRange = $bindable<DateRange>({ start: undefined, end: undefined }),
		adults = $bindable(2),
		children = $bindable(0)
	}: {
		accommodation: AccommodationDetail;
		dateRange?: DateRange;
		adults?: number;
		children?: number;
	} = $props();

	let open = $state(false);

	const tz = getLocalTimeZone();
	const nightly = $derived(effectiveNightly(accommodation));

	const nights = $derived.by(() => {
		const s = dateRange?.start;
		const e = dateRange?.end;
		if (!s || !e) return 0;
		return Math.max(0, Math.round((e.toDate(tz).getTime() - s.toDate(tz).getTime()) / 86400000));
	});
</script>

<div
	class="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 border-t bg-background/95 px-4 py-3 backdrop-blur lg:hidden"
>
	<div class="min-w-0">
		<p class="text-sm">
			<span class="font-semibold">{formatCurrency(nightly)}</span>
			<span class="text-muted-foreground">night</span>
		</p>
		<p class="truncate text-xs text-muted-foreground">
			{nights > 0 ? `${nights} ${nights === 1 ? 'night' : 'nights'} selected` : 'Add your dates'}
		</p>
	</div>

	<Button size="lg" class="h-11 shrink-0 px-6" onclick={() => (open = true)}>
		{accommodation.instantBooking ? 'Reserve' : 'Request to book'}
	</Button>
</div>

<Sheet bind:open>
	<SheetContent side="bottom" class="max-h-[92vh] gap-0 overflow-y-auto rounded-t-2xl">
		<SheetHeader class="border-b">
			<SheetTitle>Reserve your stay</SheetTitle>
		</SheetHeader>
		<div class="p-4">
			<AccommodationBookingPanel {accommodation} bind:dateRange bind:adults bind:children />
		</div>
	</SheetContent>
</Sheet>
