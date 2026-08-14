<script lang="ts">
	// I18N
	import { m } from '@/lib/paraglide/messages';

	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useConvexClient } from 'convex-svelte';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import Spinner from '@/components/ui/spinner/spinner.svelte';

	// UTILS
	import { safeMutation } from '@/utils/convexHelpers';
	import { toastResult } from '@/utils/toastResult';

	// TYPES
	import type { typesBookingSafe } from '@/shared/features/booking/types/bookingTypes';

	/**
	 * The commit itself. Both flags are bindable: `pending` so the dialog's "Not yet" button
	 * locks down while the mutation is in flight (closing mid-confirm is the one way to lose
	 * the result), and `open` so the dialog closes here, where success is actually known.
	 */
	let {
		booking,
		pending = $bindable(false),
		open = $bindable(false)
	}: {
		booking: typesBookingSafe | null;
		pending?: boolean;
		open?: boolean;
	} = $props();

	const convex = useConvexClient();

	async function handleConfirmBooking() {
		if (!booking) return;
		pending = true;
		try {
			const result = await safeMutation(
				convex,
				api.tables.bookings.mutations.confirmBooking.confirmBooking,
				{ bookingId: booking._id, locale: 'en' }
			);
			if (!toastResult(result)) return;
			open = false;
		} finally {
			pending = false;
		}
	}
</script>

<Button type="button" onclick={handleConfirmBooking} disabled={pending}>
	{#if pending}
		<Spinner />
	{/if}

	{m['BookingsFeature.BookingsDetailSheet.ConfirmBookingDialog.ConfirmBookingButton.confirm']()}
</Button>
