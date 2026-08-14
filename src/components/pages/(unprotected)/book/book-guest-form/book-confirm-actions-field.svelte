<script lang="ts">
	// I18N
	import { m } from '@/paraglide/messages';

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

	const confirmLabel = $derived(
		instantBooking
			? m['BookPage.BookConfirmActionsField.confirmReservation']()
			: m['BookPage.BookConfirmActionsField.requestToBook']()
	);
</script>

<div class="space-y-3">
	<p class="text-xs leading-relaxed text-muted-foreground">
		{m['BookPage.BookConfirmActionsField.agreement']({
			action: confirmLabel,
			paymentMethod: paymentMethodLabel(paymentMethod)
		})}
	</p>

	{#if attempted && datesMissing}
		<p class="text-sm text-destructive" role="alert" aria-live="polite">
			{m['BookPage.BookConfirmActionsField.pickDates']()}
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
