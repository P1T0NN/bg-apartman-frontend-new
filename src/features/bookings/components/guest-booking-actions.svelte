<script lang="ts">
	// I18N
	import { m } from '@/lib/paraglide/messages';

	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useConvexClient } from 'convex-svelte';

	// COMPONENTS
	import { AlertDialog } from '@/components/ui/alert-dialog';
	import { Button } from '@/components/ui/button/index.js';

	// UTILS
	import { safeMutation } from '@/utils/convexHelpers';
	import { toastResult } from '@/utils/toastResult';
	import { guestCancelConsequence } from '@/features/bookings/utils/guestCancelConsequence';
	import { guestMayCancelConfirmed } from '@/shared/features/booking/utils/guestMayCancelConfirmedBooking';
	import { todayInPropertyZone } from '@/shared/features/booking/utils/daysUntilCheckIn';

	// TYPES
	import type { Id } from '@/convex/_generated/dataModel';
	import type { typesReservationBooking } from '@/shared/features/booking/types/bookingTypes';

	// LUCIDE ICONS
	import { Loader } from '@lucide/svelte';

	/**
	 * The guest's actions on their own booking — withdraw a request, cancel a confirmed stay.
	 *
	 * Which action appears comes from the same guard the mutation enforces
	 * (`guestMayCancelConfirmed`), so a guest never sees a button that would be rejected. The
	 * confirm copy states the concrete consequence from the booking's policy snapshot
	 * (GuestSystemDesign.md §4).
	 */
	let {
		bookingId,
		booking
	}: {
		bookingId: Id<'bookings'>;
		booking: typesReservationBooking;
	} = $props();

	const convex = useConvexClient();

	let isPending = $state(false);
	let confirmOpen = $state(false);

	const action = $derived.by<'withdraw' | 'cancel' | null>(() => {
		if (booking.status === 'pending') return 'withdraw';
		if (
			booking.status === 'confirmed' &&
			guestMayCancelConfirmed(
				booking.checkInDate,
				todayInPropertyZone(),
				booking.policy,
				booking.paymentMethod
			)
		) {
			return 'cancel';
		}
		return null;
	});

	// Cash inside the window: the button is gone, but absence of a button is never a dead
	// end (GuestSystemDesign.md §4) — say who to contact instead.
	const windowClosed = $derived(booking.status === 'confirmed' && action === null);

	// Withdrawing is a non-event, so its dialog stays gentle; cancelling a confirmed stay
	// names what it costs.
	const copy = $derived.by(() => {
		if (action === 'withdraw') {
			return {
				trigger: m['BookingsFeature.GuestBookingActions.withdrawRequest'](),
				variant: 'outline' as const,
				title: m['BookingsFeature.GuestBookingActions.withdrawTitle'](),
				body: m['BookingsFeature.GuestBookingActions.withdrawBody']({ hostName: booking.hostName }),
				keep: m['BookingsFeature.GuestBookingActions.keepRequest'](),
				go: m['BookingsFeature.GuestBookingActions.withdrawRequest']()
			};
		}
		return {
			trigger: m['BookingsFeature.GuestBookingActions.cancelBooking'](),
			variant: 'destructive' as const,
			title: m['BookingsFeature.GuestBookingActions.cancelTitle'](),
			body: guestCancelConsequence(booking.checkInDate, booking.policy, booking.paymentMethod),
			keep: m['BookingsFeature.GuestBookingActions.keepBooking'](),
			go: m['BookingsFeature.GuestBookingActions.cancelBooking']()
		};
	});

	async function run() {
		if (!action) return;
		isPending = true;
		try {
			const result = await safeMutation(
				convex,
				action === 'withdraw'
					? api.tables.bookings.mutations.withdrawBookingGuest.withdrawBookingGuest
					: api.tables.bookings.mutations.cancelBookingGuest.cancelBookingGuest,
				{ bookingId, locale: 'en' }
			);
			if (toastResult(result)) confirmOpen = false;
		} finally {
			isPending = false;
		}
	}
</script>

{#if windowClosed}
	<p class="self-center text-xs text-muted-foreground">
		{m['BookingsFeature.GuestBookingActions.windowClosed']({ hostName: booking.hostName })}
	</p>
{:else if action}
	<Button variant={copy.variant} onclick={() => (confirmOpen = true)} disabled={isPending}>
		{copy.trigger}
	</Button>

	<AlertDialog bind:open={confirmOpen} hideTrigger>
		<div class="alert-dialog__header">
			<h2>{copy.title}</h2>
			<p>{copy.body}</p>
		</div>

		<div class="alert-dialog__footer">
			<Button
				type="button"
				variant="outline"
				onclick={() => (confirmOpen = false)}
				disabled={isPending}
			>
				{copy.keep}
			</Button>
			<Button type="button" variant={copy.variant} onclick={run} disabled={isPending}>
				{#if isPending}
					<Loader class="h-3 w-3 animate-spin" />
				{/if}
				{copy.go}
			</Button>
		</div>
	</AlertDialog>
{/if}
