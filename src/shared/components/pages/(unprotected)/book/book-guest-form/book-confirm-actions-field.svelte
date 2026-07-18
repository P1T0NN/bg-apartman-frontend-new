<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';

	// COMPONENTS
	import { Button } from '@/shared/components/ui/button/index.js';

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
			? m['BookAccommodationPage.BookConfirmActionsField.confirmReservation']()
			: m['BookAccommodationPage.BookConfirmActionsField.requestToBook']()
	);
</script>

<div class="space-y-3">
	<p class="text-xs leading-relaxed text-muted-foreground">
		{m['BookAccommodationPage.BookConfirmActionsField.bySelecting']({ label: confirmLabel })}
		{m['BookAccommodationPage.BookConfirmActionsField.youAgreeToTheHostsHouseRules']({
			paymentMethod: paymentMethodLabel(paymentMethod)
		})}
	</p>

	{#if attempted && datesMissing}
		<p class="text-sm text-destructive" role="alert" aria-live="polite">
			{m['BookAccommodationPage.BookConfirmActionsField.pleasePickYourDates']()}
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
