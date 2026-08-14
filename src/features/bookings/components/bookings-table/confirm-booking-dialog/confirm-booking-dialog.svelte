<script lang="ts">
	// I18N
	import { m } from '@/lib/paraglide/messages';

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
		booking
			? `${booking.guestFirstName} ${booking.guestLastName}`
			: m['BookingsFeature.BookingsDetailSheet.ConfirmBookingDialog.theGuest']()
	);

	const paymentSentence = $derived(
		booking?.paymentMethod === 'online'
			? m['BookingsFeature.BookingsDetailSheet.ConfirmBookingDialog.chargedNow']()
			: m['BookingsFeature.BookingsDetailSheet.ConfirmBookingDialog.payAtProperty']()
	);
</script>

<AlertDialog bind:open hideTrigger>
	<div class="alert-dialog__header">
		<h2>{m['BookingsFeature.BookingsDetailSheet.ConfirmBookingDialog.title']()}</h2>
		<p>{m['BookingsFeature.BookingsDetailSheet.ConfirmBookingDialog.body']({ guest: guestName, payment: paymentSentence })}</p>
	</div>

	<div class="alert-dialog__footer">
		<Button type="button" variant="outline" onclick={() => (open = false)} disabled={pending}>
			{m['BookingsFeature.BookingsDetailSheet.ConfirmBookingDialog.notYet']()}
		</Button>

		<ConfirmBookingButton {booking} bind:pending bind:open />
	</div>
</AlertDialog>
