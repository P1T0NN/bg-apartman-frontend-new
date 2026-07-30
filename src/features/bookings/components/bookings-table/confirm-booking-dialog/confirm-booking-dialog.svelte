<script lang="ts">
	// COMPONENTS
	import { AlertDialog } from '@/components/ui/alert-dialog';
	import { Button } from '@/components/ui/button/index.js';
	import ConfirmBookingButton from './confirm-booking-button.svelte';

	// TYPES
	import type { typesBookingSafe } from '@/shared/features/booking/types/bookingTypes';

	/**
	 * Confirming is the one host action that creates an obligation, so it names its
	 * consequence before it happens (HostSystemDesign.md §3): the dates are committed, the
	 * guest is told, and any competing requests for those nights are declined.
	 *
	 * The copy is payment-aware — an online booking is captured at this moment, which the
	 * host should know before clicking.
	 */
	let {
		booking,
		open = $bindable(false)
	}: {
		booking: typesBookingSafe | null;
		open?: boolean;
	} = $props();

	let pending = $state(false);

	const guestName = $derived(
		booking ? `${booking.guestFirstName} ${booking.guestLastName}` : 'The guest'
	);

	const paymentSentence = $derived(
		booking?.paymentMethod === 'online'
			? "Their card will be charged now and they'll be notified by email."
			: 'They will be notified by email and pay you at the property.'
	);
</script>

<AlertDialog bind:open hideTrigger>
	<div class="alert-dialog__header">
		<h2>Confirm this booking?</h2>
		<p>
			{guestName}'s stay is committed for these dates. {paymentSentence} Any other requests for the same
			nights are declined automatically.
		</p>
	</div>

	<div class="alert-dialog__footer">
		<Button type="button" variant="outline" onclick={() => (open = false)} disabled={pending}>
			Not yet
		</Button>

		<ConfirmBookingButton {booking} bind:pending bind:open />
	</div>
</AlertDialog>
