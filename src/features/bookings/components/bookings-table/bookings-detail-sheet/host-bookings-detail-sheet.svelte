<script lang="ts">
	// COMPONENTS
	import BookingsDetailSheet from './bookings-detail-sheet.svelte';
	import DeclineBookingDialog from '../decline-booking-dialog.svelte';
	import CancelBookingDialog from '../cancel-booking-dialog.svelte';
	import ConfirmBookingDialog from '../confirm-booking-dialog/confirm-booking-dialog.svelte';

	// TYPES
	import type {
		typesBookingSafe,
		typesBookingAction
	} from '@/shared/features/booking/types/bookingTypes';

	/**
	 * The detail sheet in host context: the shared sheet plus the three dialogs its action
	 * footer opens. They live here because they exist *because of* that footer — nothing else
	 * in the app opens them — and here rather than in the sheet itself so the guest's
	 * read-only sheet never ships host mutations.
	 */
	let {
		booking,
		open = $bindable(false),
		onOpenChange
	}: {
		booking: typesBookingSafe | null;
		open?: boolean;
		/** Fires on every open/close — the reservations page uses it to drop `?booking=`. */
		onOpenChange?: (open: boolean) => void;
	} = $props();

	// Every host action states its consequence before it happens (HostSystemDesign.md §3),
	// so all three open a dialog; the sheet's action just picks the target.
	let declineTarget = $state<typesBookingSafe | null>(null);
	let declineOpen = $state(false);
	let cancelTarget = $state<typesBookingSafe | null>(null);
	let cancelOpen = $state(false);
	let confirmTarget = $state<typesBookingSafe | null>(null);
	let confirmOpen = $state(false);

	function handleAction(target: typesBookingSafe, action: typesBookingAction) {
		if (action === 'decline') {
			declineTarget = target;
			declineOpen = true;
			return;
		}

		if (action === 'cancel') {
			cancelTarget = target;
			cancelOpen = true;
			return;
		}

		if (action === 'confirm') {
			confirmTarget = target;
			confirmOpen = true;
		}
		// check_in / check_out are cron-driven — the sheet never emits them as host actions.
	}
</script>

<BookingsDetailSheet {booking} bind:open {onOpenChange} onAction={handleAction} />

<DeclineBookingDialog booking={declineTarget} bind:open={declineOpen} />
<CancelBookingDialog booking={cancelTarget} bind:open={cancelOpen} />
<ConfirmBookingDialog booking={confirmTarget} bind:open={confirmOpen} />
