<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';

	// UTILS
	import { paymentMethodLabel } from '@/features/bookings/data/paymentMethods';

	// LUCIDE ICONS
	import ZapIcon from '@lucide/svelte/icons/zap';
	import BanknoteIcon from '@lucide/svelte/icons/banknote';

	// TYPES
	import type { PaymentMethod } from '@/features/bookings/data/paymentMethods';

	let {
		instantBooking,
		paymentMethod
	}: {
		instantBooking: boolean;
		paymentMethod: PaymentMethod;
	} = $props();
</script>

<div class="flex items-center justify-center gap-4 border-t pt-3 text-xs text-muted-foreground">
	{#if instantBooking}
		<span class="flex items-center gap-1.5">
			<ZapIcon class="size-3.5" aria-hidden="true" />
			{m['AccommodationPage.AccommodationBookingPanel.instantBooking']()}
		</span>
	{/if}

	<span class="flex items-center gap-1.5">
		<BanknoteIcon class="size-3.5" aria-hidden="true" />
		{paymentMethodLabel(paymentMethod)}
	</span>
</div>
