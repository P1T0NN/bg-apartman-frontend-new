<script lang="ts">
	// I18N
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import { FeatureStatus } from '@/components/ui/feature-status/index.js';

	// DATA
	import { ACCOMMODATION_STATUS_CONFIG } from '@/features/accommodations/data/accommodationsData';

	// UTILS
	import { listingIsListingFee } from '@/shared/features/accommodation/utils/listingFeeState';

	// TYPES
	import type { AdminAccommodationRow } from '@/shared/features/accommodation/types/accommodationTypes';

	/**
	 * A listing's moderation status, plus the one billing fact that changes what an admin
	 * can do with it.
	 */
	let { row }: { row: AdminAccommodationRow } = $props();

	/**
	 * The publish gate's explanation, stated BEFORE it refuses (ASD §8): an unpaid
	 * `listing_fee` listing is server-rejected for `published`, so the reason belongs on the
	 * row rather than being discovered by clicking Publish.
	 *
	 * Only the BLOCKING state earns a chip. A "Paid" badge on every healthy row is noise in
	 * a full table — the signal here is "this one can't go live yet".
	 */
	const awaitingPayment = $derived(
		listingIsListingFee(row) && row.apartmentSubscriptionExpiryDate === undefined
	);
</script>

<div class="flex flex-col items-start gap-1">
	<FeatureStatus config={ACCOMMODATION_STATUS_CONFIG} status={row.status} />

	{#if awaitingPayment}
		<span
			class="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-500/20 ring-inset dark:text-amber-300"
		>
			{m['AdminAccommodationsPage.AdminAccommodationsTableStatus.awaitingPayment']()}
		</span>
	{/if}
</div>
