<script lang="ts">
	// I18N
	import { m } from '@/lib/paraglide/messages';
	import { getLocale } from '@/lib/paraglide/runtime';

	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useConvexClient } from 'convex-svelte';

	// CONFIG
	import { ACCOMMODATIONS_CONFIG } from '@/shared/config';

	// COMPONENTS
	import { AlertDialog } from '@/components/ui/alert-dialog';
	import { Button } from '@/components/ui/button/index.js';
	import Spinner from '@/components/ui/spinner/spinner.svelte';

	// UTILS
	import { safeAction } from '@/utils/convexHelpers';
	import { toastResult } from '@/utils/toastResult';

	// TYPES
	import type { Id } from '@/convex/_generated/dataModel';
	import type { AdminAccommodationRow } from '@/shared/features/accommodation/types/accommodationTypes';

	/**
	 * Refund a paid listing fee (StripeTODO §8a). Rendered only when the row is refundable —
	 * `listing_fee` with a Stripe `paymentRef` — and the server re-checks both.
	 *
	 * The dialog says exactly what the refund does: the money goes back at Stripe and the
	 * listing returns to `pending_review` (unpaid start state) — existing stays are unaffected
	 * (bookings live out, new ones are blocked by status ≠ published). One confirm, no
	 * options: the refund is all-or-nothing, as the money moved all at once.
	 */
	let {
		accommodation,
		open = $bindable(false)
	}: {
		accommodation: AdminAccommodationRow | null;
		open?: boolean;
	} = $props();

	const convex = useConvexClient();

	let isPending = $state(false);

	// What was actually paid — paymentAmount is the honest source, the config is the fallback.
	const amount = $derived(
		accommodation?.paymentAmount ?? ACCOMMODATIONS_CONFIG.LISTING_FEE.AMOUNT
	);

	async function handleRefund() {
		if (!accommodation) return;

		isPending = true;

		try {
			const result = await safeAction(
				convex,
				api.tables.accommodations.mutations.refundListingFee.refundListingFee,
				{
					id: accommodation._id as Id<'apartments'>,
					// Translated here, stored as `moderationReason` — the backend never writes
					// display text (same contract as the moderation dialog's reason).
					reason: m['AdminAccommodationsPage.AdminRefundListingFeeDialog.reasonDefault'](),
					locale: getLocale()
				}
			);
			if (!toastResult(result)) return;
			open = false;
		} finally {
			isPending = false;
		}
	}
</script>

<AlertDialog bind:open hideTrigger>
	<div class="alert-dialog__header">
		<h2>{m['AdminAccommodationsPage.AdminAccommodationsTableActions.refundListingFee']()}</h2>
		<p>
			{m['AdminAccommodationsPage.AdminAccommodationsTableActions.refundListingFeeConfirm']({
				amount,
				title:
					accommodation?.title ??
					m['AdminAccommodationsPage.AdminRefundListingFeeDialog.thisListing']()
			})}
		</p>
	</div>

	<div class="alert-dialog__footer">
		<Button type="button" variant="outline" onclick={() => (open = false)} disabled={isPending}>
			{m['AdminAccommodationsPage.AdminRefundListingFeeDialog.cancel']()}
		</Button>

		<Button type="button" onclick={handleRefund} disabled={isPending}>
			{#if isPending}
				<Spinner />
			{/if}
			{m['AdminAccommodationsPage.AdminAccommodationsTableActions.refundListingFee']()}
		</Button>
	</div>
</AlertDialog>
