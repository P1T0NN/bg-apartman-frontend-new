<script lang="ts">
	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// UTILS
	import { paymentMethodLabel } from '@/features/bookings/utils/paymentMethodLabel';

	// TYPES
	import type { Doc } from '@/convex/_generated/dataModel';

	let {
		instantBooking,
		paymentMethod,
		datesMissing = false,
		attempted = $bindable(false),
		busy = false
	}: {
		instantBooking: boolean;
		paymentMethod: Doc<'bookings'>['paymentMethod'];
		datesMissing?: boolean;
		attempted?: boolean;
		busy?: boolean;
	} = $props();

	const confirmLabel = $derived(instantBooking ? 'Confirm reservation' : 'Request to book');
</script>

<div class="space-y-3">
	<p class="text-xs leading-relaxed text-muted-foreground">
		By selecting {confirmLabel}
		you agree to the host’s house rules and to pay the full amount by {paymentMethodLabel(
			paymentMethod
		)}.
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
