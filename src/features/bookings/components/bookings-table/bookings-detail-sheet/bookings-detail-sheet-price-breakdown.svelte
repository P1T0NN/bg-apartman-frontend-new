<script lang="ts">
	// I18N
	import { m } from '@/paraglide/messages';

	// COMPONENTS
	import { Separator } from '@/components/ui/separator/index.js';

	// UTILS
	import { formatCurrency, formatNights } from '@/utils/formatters';

	// DATA
	import { PAYMENT_STATUS_CONFIG } from '@/features/bookings/data/bookingsData';

	// TYPES
	import type { typesBookingSafe } from '@/shared/features/booking/types/bookingTypes';

	let { booking }: { booking: typesBookingSafe } = $props();

	const payment = $derived(PAYMENT_STATUS_CONFIG[booking.paymentStatus]);
</script>

<section class="space-y-2">
	<h3 class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
		{m['BookingsFeature.BookingsDetailSheet.BookingsDetailSheetPriceBreakdown.title']()}
	</h3>

	<div class="rounded-lg border p-3 text-sm">
		<div class="flex items-center justify-between py-1 text-muted-foreground">
			<span>
				{formatCurrency(booking.subtotal / booking.numberOfNights)} × {formatNights(
					booking.numberOfNights
				)}
			</span>

			<span class="text-foreground tabular-nums">{formatCurrency(booking.subtotal)}</span>
		</div>

		<div class="flex items-center justify-between py-1 text-muted-foreground">
			<span>{m['BookingsFeature.BookingsDetailSheet.BookingsDetailSheetPriceBreakdown.cleaningFee']()}</span>
			<span class="text-foreground tabular-nums">{formatCurrency(booking.cleaningFee)}</span>
		</div>

		<!-- From the booking's own price SNAPSHOT, never live config — a later fee
		     change can't reprice a stay that already happened
		     (AccommodationsSystemDesign.md §8's "money facts are snapshots"). -->
		{#if booking.platformFee > 0}
			<div class="flex items-center justify-between py-1 text-muted-foreground">
				<span>{m['BookingsFeature.BookingsDetailSheet.BookingsDetailSheetPriceBreakdown.serviceFee']()}</span>
				<span class="text-foreground tabular-nums">{formatCurrency(booking.platformFee)}</span>
			</div>
		{/if}

		<Separator class="my-2" />

		<div class="flex items-center justify-between py-1 font-semibold">
			<span
				>{m['BookingsFeature.BookingsDetailSheet.BookingsDetailSheetPriceBreakdown.total']({
					payment: payment.label.toLowerCase()
				})}</span
			>
			<span class="tabular-nums">{formatCurrency(booking.total)}</span>
		</div>
	</div>
</section>
