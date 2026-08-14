<script lang="ts">
	// I18N
	import { m } from '@/lib/paraglide/messages';

	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useConvexClient } from 'convex-svelte';

	// COMPONENTS
	import { AlertDialog } from '@/components/ui/alert-dialog';
	import { Button } from '@/components/ui/button/index.js';
	import { NativeSelect } from '@/components/ui/select/index.js';

	// UTILS
	import { safeMutation } from '@/utils/convexHelpers';
	import { toastResult } from '@/utils/toastResult';
	import { formatDate } from '@/utils/formatters';
	import { listingFeeState } from '@/shared/features/accommodation/utils/listingFeeState';

	// TYPES
	import type { Id } from '@/convex/_generated/dataModel';
	import type { AdminAccommodationRow } from '@/shared/features/accommodation/types/accommodationTypes';

	// LUCIDE ICONS
	import { Loader } from '@lucide/svelte';

	/**
	 * Grant a listing-fee waiver ("free publish") — paid coverage with no payment and no
	 * revenue event (AccommodationsSystemDesign.md §8's first-period gate, waived). The
	 * listing gets the same `apartmentSubscriptionExpiryDate` a payment would stamp, but the
	 * mutation records no payment fields and tracks no `invoice.paid` analytics, so
	 * `/admin/dashboard` revenue is untouched. The audit entry is the trail.
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

	let duration = $state('1m');
	let isPending = $state(false);

	// What the listing looks like right now — the dialog says where the grant lands.
	const fee = $derived(accommodation ? listingFeeState(accommodation) : null);
	const coveredUntil = $derived(
		fee && fee.kind !== 'inactive' && fee.kind !== 'unpaid' && fee.expiresAt !== undefined
			? formatDate(fee.expiresAt)
			: null
	);

	async function submit() {
		if (!accommodation) return;
		isPending = true;
		try {
			const result = await safeMutation(
				convex,
				api.tables.accommodations.mutations.grantFreePublish.grantFreePublish,
				{ id: accommodation._id as Id<'apartments'>, duration }
			);
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
		if (next) duration = '1m';
	}}
>
	<div class="alert-dialog__header">
		<h2>{m['AdminAccommodationsPage.AdminGrantFreePublishDialog.title']()}</h2>
		<p>
			{m['AdminAccommodationsPage.AdminGrantFreePublishDialog.body']({
				listing:
					accommodation?.title ?? m['AdminAccommodationsPage.AdminGrantFreePublishDialog.thisListing']()
			})}
		</p>
	</div>

	{#if fee}
		<p class="text-sm text-muted-foreground">
			{#if accommodation?.status === 'suspended'}
				{m['AdminAccommodationsPage.AdminGrantFreePublishDialog.suspendedNote']()}
			{:else if fee.kind === 'unpaid'}
				{m['AdminAccommodationsPage.AdminGrantFreePublishDialog.unpaidNote']()}
			{:else if fee.kind === 'lapsed'}
				{m['AdminAccommodationsPage.AdminGrantFreePublishDialog.lapsedNote']()}
			{:else if fee.kind === 'active' && fee.daysLeft === null}
				{m['AdminAccommodationsPage.AdminGrantFreePublishDialog.coveredForeverNote']()}
			{:else if fee.kind === 'active' || fee.kind === 'expiring'}
				{m['AdminAccommodationsPage.AdminGrantFreePublishDialog.coveredUntilNote']({
					date: coveredUntil ?? ''
				})}
			{:else if fee.kind === 'grace'}
				{m['AdminAccommodationsPage.AdminGrantFreePublishDialog.graceNote']()}
			{/if}
		</p>
	{/if}

	<div class="flex flex-col gap-3">
		<label class="flex flex-col gap-1 text-sm">
			<span>{m['AdminAccommodationsPage.AdminGrantFreePublishDialog.duration']()}</span>
			<NativeSelect
				bind:value={duration}
				disabled={isPending}
				options={[
					{ value: '1m', label: m['AdminAccommodationsPage.AdminGrantFreePublishDialog.oneMonth']() },
					{
						value: '3m',
						label: m['AdminAccommodationsPage.AdminGrantFreePublishDialog.threeMonths']()
					},
					{ value: '6m', label: m['AdminAccommodationsPage.AdminGrantFreePublishDialog.sixMonths']() },
					{ value: '1y', label: m['AdminAccommodationsPage.AdminGrantFreePublishDialog.oneYear']() },
					{
						value: 'forever',
						label: m['AdminAccommodationsPage.AdminGrantFreePublishDialog.forever']()
					}
				]}
			/>
		</label>
	</div>

	<div class="alert-dialog__footer">
		<Button type="button" variant="outline" onclick={() => (open = false)} disabled={isPending}>
			{m['AdminAccommodationsPage.AdminGrantFreePublishDialog.cancel']()}
		</Button>
		<Button type="button" onclick={submit} disabled={isPending}>
			{#if isPending}
				<Loader class="h-3 w-3 animate-spin" />
			{/if}
			{m['AdminAccommodationsPage.AdminGrantFreePublishDialog.confirm']()}
		</Button>
	</div>
</AlertDialog>
