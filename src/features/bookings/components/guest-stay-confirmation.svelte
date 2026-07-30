<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useConvexClient } from 'convex-svelte';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// UTILS
	import { safeMutation } from '@/utils/convexHelpers';
	import { toastResult } from '@/utils/toastResult';
	import {
		stayConfirmationAnswered,
		stayConfirmationPending
	} from '@/shared/features/booking/utils/stayConfirmation';

	// TYPES
	import type { Id } from '@/convex/_generated/dataModel';
	import type { typesReservationBooking } from '@/shared/features/booking/types/bookingTypes';

	// LUCIDE ICONS
	import { Loader } from '@lucide/svelte';
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import HandIcon from '@lucide/svelte/icons/hand';

	/**
	 * The guest half of stay confirmation (BookingSystemDesign.md §11): the host asked
	 * "still coming?" and this banner is the one-click yes. Renders only while a request is
	 * unanswered on a confirmed stay; flips to a quiet ✓ once answered (this page is live,
	 * so the flip is instant).
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

	const showAsk = $derived(booking.status === 'confirmed' && stayConfirmationPending(booking));
	const showConfirmed = $derived(
		booking.status === 'confirmed' && stayConfirmationAnswered(booking)
	);

	async function confirm() {
		isPending = true;
		try {
			const result = await safeMutation(
				convex,
				api.tables.bookings.mutations.confirmStay.confirmStay,
				{ bookingId, locale: 'en' }
			);
			toastResult(result);
		} finally {
			isPending = false;
		}
	}
</script>

{#if showAsk}
	<div
		class="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 sm:flex-row sm:justify-between sm:text-left"
	>
		<div class="flex items-start gap-2.5">
			<HandIcon
				class="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400"
				aria-hidden="true"
			/>
			<div>
				<p class="text-sm font-medium">{booking.hostName} asked: still coming?</p>
				<p class="text-xs text-muted-foreground">
					One click lets them prepare for your arrival. If your plans changed, use the actions below
					instead.
				</p>
			</div>
		</div>

		<Button onclick={confirm} disabled={isPending} class="shrink-0">
			{#if isPending}
				<Loader class="h-3 w-3 animate-spin" />
			{/if}
			Yes, I'm coming
		</Button>
	</div>
{:else if showConfirmed}
	<p class="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
		<CircleCheckIcon class="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
		You've confirmed you're coming — {booking.hostName} knows.
	</p>
{/if}
