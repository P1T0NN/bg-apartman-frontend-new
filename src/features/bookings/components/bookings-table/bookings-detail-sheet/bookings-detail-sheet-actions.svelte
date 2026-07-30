<script lang="ts">
	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// UTILS
	import { availableBookingActions } from '@/features/bookings/utils/availableBookingActions';
	import {
		daysUntilCheckIn,
		todayInPropertyZone
	} from '@/shared/features/booking/utils/daysUntilCheckIn';

	// TYPES
	import type {
		typesBookingSafe,
		typesBookingAction
	} from '@/shared/features/booking/types/bookingTypes';

	/**
	 * The sheet's footer: the actions this booking allows, or — when a confirmed booking allows
	 * none — why. Absence of a button is never a dead end: say why.
	 */
	let {
		booking,
		getActions = availableBookingActions,
		onAction
	}: {
		booking: typesBookingSafe;
		/** Override the per-status action set (admin context offers cancel only). */
		getActions?: typeof availableBookingActions;
		/** Absent = read-only context (a guest reading their own booking): no footer at all. */
		onAction?: (action: typesBookingAction) => void;
	} = $props();

	const actions = $derived(onAction ? getActions(booking) : []);

	// Online bookings inside the free-cancel window offer no cancel — the guest's paid stay
	// is ironclad (BSD §4). Cash inside the window needs a provably ignored stay-confirmation
	// request (§11).
	const cancelWindowClosed = $derived(
		Boolean(onAction && booking.status === 'confirmed' && actions.length === 0)
	);
	
	const stayStartsToday = $derived(
		daysUntilCheckIn(booking.checkInDate, todayInPropertyZone()) <= 0
	);
</script>

{#if actions.length > 0}
	<footer class="mt-auto flex flex-row gap-2 border-t p-4">
		{#each actions as { action, meta } (action)}
			<Button variant={meta.variant} size="lg" class="flex-1" onclick={() => onAction?.(action)}>
				{meta.label}
			</Button>
		{/each}
	</footer>
{:else if cancelWindowClosed}
	<footer class="mt-auto border-t p-4">
		<p class="text-center text-xs text-muted-foreground">
			{#if booking.paymentMethod === 'online'}
				This paid booking can't be cancelled this close to check-in — the guest's stay is committed.
				For a genuine emergency, contact support.
			{:else if stayStartsToday}
				The stay starts today, so cancellation is closed. If something's wrong, contact support.
			{:else}
				Cancelling unlocks only if the guest ignores a stay-confirmation request — use "Ask guest to
				confirm" above.
			{/if}
		</p>
	</footer>
{/if}
