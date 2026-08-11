<script lang="ts">
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
		<h2>Grant free publish?</h2>
		<p>
			Waives the listing fee for the chosen duration — {accommodation?.title ?? 'this listing'}
			behaves exactly as if it had paid, but no payment is recorded and nothing counts as
			revenue. The grant is audit-logged.
		</p>
	</div>

	{#if fee}
		<p class="text-sm text-muted-foreground">
			{#if accommodation?.status === 'suspended'}
				This listing is suspended — the grant covers the fee but does not unpublish it;
				Publish stays a moderation step.
			{:else if fee.kind === 'unpaid'}
				This listing has never had a paid period — the grant covers the fee and publishes
				it immediately, no re-review.
			{:else if fee.kind === 'lapsed'}
				This listing expired — the grant revives it to live immediately, no re-review.
			{:else if fee.kind === 'active' && fee.daysLeft === null}
				Currently covered forever — the grant keeps it that way.
			{:else if fee.kind === 'active' || fee.kind === 'expiring'}
				Currently covered until {coveredUntil} — the grant extends it from there.
			{:else if fee.kind === 'grace'}
				Currently in the overdue grace window — the grant extends from the current expiry.
			{/if}
		</p>
	{/if}

	<div class="flex flex-col gap-3">
		<label class="flex flex-col gap-1 text-sm">
			<span>Duration</span>
			<NativeSelect
				bind:value={duration}
				disabled={isPending}
				options={[
					{ value: '1m', label: '1 month' },
					{ value: '3m', label: '3 months' },
					{ value: '6m', label: '6 months' },
					{ value: '1y', label: '1 year' },
					{ value: 'forever', label: 'Forever' }
				]}
			/>
		</label>
	</div>

	<div class="alert-dialog__footer">
		<Button type="button" variant="outline" onclick={() => (open = false)} disabled={isPending}>
			Cancel
		</Button>
		<Button type="button" onclick={submit} disabled={isPending}>
			{#if isPending}
				<Loader class="h-3 w-3 animate-spin" />
			{/if}
			Grant free publish
		</Button>
	</div>
</AlertDialog>
