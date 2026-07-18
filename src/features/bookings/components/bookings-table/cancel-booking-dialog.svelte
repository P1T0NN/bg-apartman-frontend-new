<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useConvexClient } from 'convex-svelte';
	import { m } from '@/shared/lib/paraglide/messages';
	import { getLocale } from '@/shared/lib/paraglide/runtime';

	// COMPONENTS
	import { AlertDialog } from '@/shared/components/ui/alert-dialog';
	import { Button } from '@/shared/components/ui/button/index.js';

	// UTILS
	import { safeMutation } from '@/utils/convexHelpers';
	import { toastResult } from '@/utils/toastResult';

	// TYPES
	import type { typesBookingSafe } from '@/shared/features/booking/types/bookingTypes';

	// LUCIDE ICONS
	import { Loader } from '@lucide/svelte';

	/**
	 * Controlled confirmation dialog for a host cancelling a *confirmed* booking they own.
	 * No form fields — it's a plain confirm, so it calls `cancelBookingOwner` directly via
	 * `safeMutation` (the "can't be a ConvexMutationForm" case). The mutation flips the status,
	 * refunds if paid, and emails the guest.
	 *
	 * Opened from the reservations page when the detail sheet fires the `cancel` action.
	 */
	let { booking, open = $bindable(false) }: { booking: typesBookingSafe | null; open?: boolean } =
		$props();

	const convex = useConvexClient();

	let isPending = $state(false);

	async function confirm() {
		if (!booking) return;
		isPending = true;
		try {
			const result = await safeMutation(
				convex,
				api.tables.bookings.mutations.cancelBookingOwner.cancelBookingOwner,
				{ bookingId: booking._id, locale: getLocale() }
			);
			if (!toastResult(result)) return;
			open = false;
		} finally {
			isPending = false;
		}
	}
</script>

<AlertDialog bind:open hideTrigger class="ring-destructive/30">
	<div class="alert-dialog__header">
		<h2 class="text-destructive">
			{m['CancelBookingDialog.title']()}
		</h2>
		<p>
			{m['CancelBookingDialog.description']({
				guest: booking ? `${booking.guestFirstName} ${booking.guestLastName}` : ''
			})}
		</p>
	</div>

	<div class="alert-dialog__footer">
		<Button type="button" variant="outline" onclick={() => (open = false)} disabled={isPending}>
			{m['CancelBookingDialog.cancel']()}
		</Button>
		<Button type="button" variant="destructive" onclick={confirm} disabled={isPending}>
			{#if isPending}
				<Loader class="h-3 w-3 animate-spin" />
			{/if}
			{m['CancelBookingDialog.confirm']()}
		</Button>
	</div>
</AlertDialog>
