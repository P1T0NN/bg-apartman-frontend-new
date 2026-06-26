<script lang="ts">
	// COMPONENTS
	import { Button } from '@/shared/components/ui/button/index.js';

	// UTILS
	import { paymentMethodLabel } from '@/features/bookings/data/paymentMethods';

	// TYPES
	import type { PaymentMethod } from '@/features/bookings/data/paymentMethods';

	let {
		confirmLabel,
		paymentMethod,
		datesMissing = false,
		attempted = $bindable(false),
		busy = false
	}: {
		confirmLabel: string;
		paymentMethod: PaymentMethod;
		datesMissing?: boolean;
		attempted?: boolean;
		busy?: boolean;
	} = $props();
</script>

<div class="space-y-3">
	<p class="text-xs leading-relaxed text-muted-foreground">
		By selecting <span class="font-medium text-foreground">{confirmLabel}</span>, you agree to the
		host’s house rules and to pay the full amount by {paymentMethodLabel(
			paymentMethod
		).toLowerCase()}.
	</p>
	{#if attempted && datesMissing}
		<p class="text-sm text-destructive" role="alert" aria-live="polite">
			Please pick your dates at the top of the page before you continue.
		</p>
	{/if}
	<Button
		type="submit"
		size="lg"
		class="h-11 w-full text-base sm:w-auto sm:px-8"
		disabled={busy}
		onclick={() => (attempted = true)}
	>
		{confirmLabel}
	</Button>
</div>
