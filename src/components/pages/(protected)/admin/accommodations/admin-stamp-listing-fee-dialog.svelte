<script lang="ts">
	// I18N
	import { m } from '@/lib/paraglide/messages';

	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useConvexClient } from 'convex-svelte';

	// CONFIG
	import { ACCOMMODATIONS_CONFIG } from '@/shared/config';

	// COMPONENTS
	import { AlertDialog } from '@/components/ui/alert-dialog';
	import { Button } from '@/components/ui/button/index.js';
	import { Input } from '@/components/ui/input/index.js';

	// UTILS
	import { safeMutation } from '@/utils/convexHelpers';
	import { toastResult } from '@/utils/toastResult';
	import { formatCurrency } from '@/utils/formatters';

	// TYPES
	import type { Id } from '@/convex/_generated/dataModel';
	import type { AdminAccommodationRow } from '@/shared/features/accommodation/types/accommodationTypes';

	// LUCIDE ICONS
	import { Loader } from '@lucide/svelte';

	/**
	 * Record a listing-fee payment received outside the platform — a bank transfer
	 * (AccommodationsSystemDesign.md §8, this page's §2 scope note).
	 *
	 * This grants paid time with no money trail of its own, which is exactly why the
	 * mutation audit-logs it: the audit entry IS the trail. The bank reference is required
	 * for the same reason — "which transfer was this?" must be answerable later.
	 *
	 * Rendered only in `listing_fee` mode; the caller gates it.
	 */
	let {
		accommodation,
		open = $bindable(false)
	}: {
		accommodation: AdminAccommodationRow | null;
		open?: boolean;
	} = $props();

	const convex = useConvexClient();

	const defaultAmount = ACCOMMODATIONS_CONFIG.LISTING_FEE.AMOUNT;

	let reference = $state('');
	let amount = $state(String(defaultAmount));
	let isPending = $state(false);

	const parsedAmount = $derived(Number(amount));
	const canSubmit = $derived(
		reference.trim().length > 0 && Number.isFinite(parsedAmount) && parsedAmount > 0
	);

	async function submit() {
		if (!accommodation || !canSubmit) return;
		isPending = true;
		try {
			const result = await safeMutation(convex, api.payments.listingFee.stampListingFeePayment, {
				apartmentId: accommodation._id as Id<'apartments'>,
				amount: parsedAmount,
				reference: reference.trim()
			});
			if (!toastResult(result)) return;
			open = false;
		} finally {
			isPending = false;
		}
	}
</script>

<AlertDialog
	bind:open
	hideTrigger
	onOpenChange={(next) => {
		if (next) {
			reference = '';
			amount = String(defaultAmount);
		}
	}}
>
	<div class="alert-dialog__header">
		<h2>{m['AdminAccommodationsPage.AdminStampListingFeeDialog.recordFeePaymentTitle']()}</h2>
		<p>
			{m['AdminAccommodationsPage.AdminStampListingFeeDialog.recordBody']({
				listing:
					accommodation?.title ?? m['AdminAccommodationsPage.AdminStampListingFeeDialog.thisListing']()
			})}
		</p>
	</div>

	<div class="flex flex-col gap-3">
		<div class="flex flex-col gap-1.5">
			<label for="fee-reference" class="text-sm font-medium">
				{m['AdminAccommodationsPage.AdminStampListingFeeDialog.bankReference']()}
			</label>
			<Input
				id="fee-reference"
				bind:value={reference}
				placeholder={m['AdminAccommodationsPage.AdminStampListingFeeDialog.bankReferencePlaceholder']()}
			/>
		</div>

		<div class="flex flex-col gap-1.5">
			<label for="fee-amount" class="text-sm font-medium">
				{m['AdminAccommodationsPage.AdminStampListingFeeDialog.amountLabel']({
					amount: formatCurrency(defaultAmount)
				})}
			</label>
			<Input id="fee-amount" type="number" min="1" bind:value={amount} class="tabular-nums" />
		</div>
	</div>

	<div class="alert-dialog__footer">
		<Button type="button" variant="outline" onclick={() => (open = false)} disabled={isPending}>
			{m['AdminAccommodationsPage.AdminStampListingFeeDialog.cancel']()}
		</Button>
		<Button type="button" onclick={submit} disabled={isPending || !canSubmit}>
			{#if isPending}
				<Loader class="h-3 w-3 animate-spin" />
			{/if}
			{m['AdminAccommodationsPage.AdminStampListingFeeDialog.recordPayment']()}
		</Button>
	</div>
</AlertDialog>
