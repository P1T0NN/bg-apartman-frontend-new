<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useConvexClient } from 'convex-svelte';

	// CONFIG
	import { BOOKING_POLICY } from '@/shared/config';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// UTILS
	import { safeMutation } from '@/utils/convexHelpers';
	import { toastResult } from '@/utils/toastResult';
	import { formatTs } from '@/utils/formatters';
	import {
		stayConfirmationAnswered,
		stayConfirmationPending,
		stayConfirmationUnlocksCancel
	} from '@/shared/features/booking/utils/stayConfirmation';

	// TYPES
	import type { typesBookingSafe } from '@/shared/features/booking/types/bookingTypes';

	// LUCIDE ICONS
	import { Loader } from '@lucide/svelte';
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import BellRingIcon from '@lucide/svelte/icons/bell-ring';

	/**
	 * The host half of stay confirmation (BookingSystemDesign.md §11), shown for confirmed
	 * CASH bookings: ask the guest to confirm, see whether they answered, and understand
	 * when a no-reply unlocks cancellation. Online bookings don't need it — the guest's
	 * money already proves intent.
	 */
	let { booking }: { booking: typesBookingSafe } = $props();

	const convex = useConvexClient();

	let isPending = $state(false);

	const answered = $derived(stayConfirmationAnswered(booking));
	const pending = $derived(stayConfirmationPending(booking));
	const unlocked = $derived(stayConfirmationUnlocksCancel(booking));

	async function request() {
		isPending = true;
		try {
			const result = await safeMutation(
				convex,
				api.tables.bookings.mutations.requestStayConfirmation.requestStayConfirmation,
				{ bookingId: booking._id, locale: 'en' }
			);
			toastResult(result);
		} finally {
			isPending = false;
		}
	}
</script>

<section class="space-y-2">
	<h3 class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
		Stay confirmation
	</h3>

	{#if answered}
		<div class="flex items-start gap-2.5 rounded-lg border bg-emerald-500/5 p-3 text-sm">
			<CircleCheckIcon
				class="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
				aria-hidden="true"
			/>

			<p>
				Guest confirmed they're coming ({formatTs(booking.stayConfirmedAt ?? 0)}). You can re-ask
				closer to the date if plans might change.
			</p>
		</div>
	{:else if unlocked}
		<div
			class="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm"
		>
			<BellRingIcon
				class="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400"
				aria-hidden="true"
			/>

			<p>
				No reply for over {BOOKING_POLICY.STAY_CONFIRMATION_UNLOCK_HOURS} hours (asked
				{formatTs(booking.stayConfirmationRequestedAt ?? 0)}). Cancelling is now available below if
				you need the dates back.
			</p>
		</div>
	{:else if pending}
		<div class="flex items-start gap-2.5 rounded-lg border bg-muted/30 p-3 text-sm">
			<BellRingIcon class="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
			<p>
				Asked {formatTs(booking.stayConfirmationRequestedAt ?? 0)} — no reply yet. If the guest doesn't
				respond within {BOOKING_POLICY.STAY_CONFIRMATION_UNLOCK_HOURS} hours, cancelling unlocks.
			</p>
		</div>
	{:else}
		<div
			class="flex flex-col gap-2 rounded-lg border p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
		>
			<p class="text-muted-foreground">
				Not sure the guest is coming? Ask for a one-click confirmation — they get an email, and
				you'll see the answer here.
			</p>

			<Button variant="outline" size="sm" class="shrink-0" onclick={request} disabled={isPending}>
				{#if isPending}
					<Loader class="h-3 w-3 animate-spin" />
				{/if}
				Ask guest to confirm
			</Button>
		</div>
	{/if}
</section>
