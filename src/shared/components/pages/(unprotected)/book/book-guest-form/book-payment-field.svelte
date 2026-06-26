<script lang="ts">
	// UTILS
	import {
		paymentMethodDescription,
		paymentMethodLabel
	} from '@/features/bookings/data/paymentMethods';

	// TYPES
	import type { PaymentMethod } from '@/features/bookings/data/paymentMethods';

	// LUCIDE ICONS
	import BanknoteIcon from '@lucide/svelte/icons/banknote';
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';

	let { paymentMethod }: { paymentMethod: PaymentMethod } = $props();
</script>

<section class="space-y-4">
	<div class="flex items-center gap-3 rounded-xl border border-primary bg-primary/5 p-4">
		<BanknoteIcon class="size-5 shrink-0 text-primary" aria-hidden="true" />
		<div class="min-w-0 flex-1">
			<p class="text-sm font-medium">Pay with {paymentMethodLabel(paymentMethod)}</p>
			<p class="text-xs text-muted-foreground">
				{paymentMethodDescription(paymentMethod)}
			</p>
		</div>
		<CircleCheckIcon class="size-5 shrink-0 text-primary" aria-hidden="true" />
	</div>
</section>
