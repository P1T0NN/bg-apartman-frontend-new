<script lang="ts">
	// I18N
	import { m } from '@/paraglide/messages';

	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useConvexClient } from 'convex-svelte';

	// CONFIG
	import { ACCOMMODATIONS_CONFIG } from '@/shared/config';

	// COMPONENTS
	import { AlertDialog } from '@/components/ui/alert-dialog';
	import { Button } from '@/components/ui/button/index.js';

	// UTILS
	import { safeMutation } from '@/utils/convexHelpers';
	import { toastResult } from '@/utils/toastResult';
	import { listingFeeState } from '@/shared/features/accommodation/utils/listingFeeState';

	// TYPES
	import type { typesAccommodation } from '@/shared/features/accommodation/types/accommodationTypes';

	// LUCIDE ICONS
	import ArrowRightLeftIcon from '@lucide/svelte/icons/arrow-right-left';
	import { Loader } from '@lucide/svelte';

	/**
	 * The one-way `listing_fee` → `booking_fee` switch (ASD §8 "Switching models"). The
	 * dialog states all three facts in plain words: forfeited paid days, no road back, and
	 * the new-listing escape hatch. Rendered only on `listing_fee` rows with the provider
	 * live — the caller gates it, and `booking_fee` rows get no control at all.
	 */
	let { row }: { row: typesAccommodation } = $props();

	const convex = useConvexClient();

	let open = $state(false);
	let isPending = $state(false);

	const { PERCENT, MIN_EUROS } = ACCOMMODATIONS_CONFIG.BOOKING_FEE;
	const fee = $derived(listingFeeState(row));
	const daysLeft = $derived(
		fee.kind === 'active' || fee.kind === 'expiring' ? Math.max(fee.daysLeft ?? 0, 0) : 0
	);

	async function submit() {
		isPending = true;
		try {
			const result = await safeMutation(
				convex,
				api.tables.accommodations.mutations.switchListingMonetization.switchListingMonetization,
				{ id: row._id }
			);
			if (!toastResult(result)) return;
			open = false;
		} finally {
			isPending = false;
		}
	}
</script>

<Button
	onclick={() => (open = true)}
	variant="ghost"
	size="icon-sm"
	aria-label={m['HostMyAccommodationsPage.MyAccommodationsTableChangePlan.changePlan']()}
	title={m['HostMyAccommodationsPage.MyAccommodationsTableChangePlan.changePlan']()}
>
	<ArrowRightLeftIcon class="size-4" aria-hidden="true" />
</Button>

<AlertDialog bind:open hideTrigger>
	<div class="alert-dialog__header">
		<h2>{m['HostMyAccommodationsPage.MyAccommodationsTableChangePlan.switchTitle']()}</h2>
		<p>
			{m['HostMyAccommodationsPage.MyAccommodationsTableChangePlan.switchBodyIntro']({
				title: row.title,
				percent: PERCENT,
				minEuros: MIN_EUROS
			})}
			{#if daysLeft > 0}
				{daysLeft === 1
					? m['HostMyAccommodationsPage.MyAccommodationsTableChangePlan.switchBodyDaysOne']({
							daysLeft
						})
					: m['HostMyAccommodationsPage.MyAccommodationsTableChangePlan.switchBodyDaysMany']({
							daysLeft
						})}
			{:else if fee.kind === 'active' && fee.daysLeft === null}
				{m['HostMyAccommodationsPage.MyAccommodationsTableChangePlan.switchBodyCoveredForever']()}
			{/if}
			{m['HostMyAccommodationsPage.MyAccommodationsTableChangePlan.switchBodyNoRefund']()}
		</p>
	</div>

	<div class="alert-dialog__footer">
		<Button type="button" variant="outline" onclick={() => (open = false)} disabled={isPending}>
			{m['HostMyAccommodationsPage.MyAccommodationsTableChangePlan.keepListingFee']()}
		</Button>
		<Button type="button" variant="destructive" onclick={submit} disabled={isPending}>
			{#if isPending}
				<Loader class="h-3 w-3 animate-spin" />
			{/if}
			{m['HostMyAccommodationsPage.MyAccommodationsTableChangePlan.switchPermanently']()}
		</Button>
	</div>
</AlertDialog>
