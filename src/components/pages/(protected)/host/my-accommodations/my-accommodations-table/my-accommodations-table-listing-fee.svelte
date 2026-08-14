<script lang="ts">
	// I18N
	import { m } from '@/paraglide/messages';

	// CONFIG
	import { ACCOMMODATIONS_CONFIG } from '@/shared/config';

	// COMPONENTS
	import MyAccommodationsTableRenewButton from './my-accommodations-table-renew-button.svelte';

	// UTILS
	import { formatDate } from '@/utils/formatters';
	import { cn } from '@/utils/utils.js';
	import {
		listingFeeState,
		listingIsBookingFee
	} from '@/shared/features/accommodation/utils/listingFeeState';

	// TYPES
	import type { typesAccommodation } from '@/shared/features/accommodation/types/accommodationTypes';

	let { row }: { row: typesAccommodation } = $props();

	const fee = $derived(listingFeeState(row));
</script>

<div class="flex flex-col gap-1">
	{#if listingIsBookingFee(row)}
		<!-- No "Change plan" control here — the switch is one-way (ASD §8), and a control
		     that only says "you can't" is noise. The fact and the road are visible text. -->
		<span class="text-sm text-muted-foreground">
			{m['HostMyAccommodationsPage.MyAccommodationsTableListingFee.perBookingFee']({
				percent: ACCOMMODATIONS_CONFIG.BOOKING_FEE.PERCENT
			})}
		</span>
	{:else if fee.kind === 'inactive'}
		<!-- No model stamped: the flip backfill hasn't reached this row, and the sweep
		     leaves it alone until it does. Nothing to bill, nothing to say. -->
		<span class="text-sm text-muted-foreground">—</span>
	{:else if fee.kind === 'unpaid'}
		<!-- The first payment gates going live (ASD §8) — say so where the host looks. -->
		<span class="text-sm font-medium text-foreground">
			{m['HostMyAccommodationsPage.MyAccommodationsTableListingFee.listingFeeNotPaid']({
				amount: ACCOMMODATIONS_CONFIG.LISTING_FEE.AMOUNT
			})}
		</span>
		<MyAccommodationsTableRenewButton
			apartmentId={row._id}
			label={m['HostMyAccommodationsPage.MyAccommodationsTableListingFee.payNow']()}
		/>
	{:else}
		<span
			class={cn(
				'text-sm',
				fee.kind === 'active' ? 'text-muted-foreground' : 'font-medium text-foreground'
			)}
		>
			{#if fee.kind === 'lapsed'}
				{m['HostMyAccommodationsPage.MyAccommodationsTableListingFee.expired']()}
			{:else if fee.kind === 'grace'}
				{m['HostMyAccommodationsPage.MyAccommodationsTableListingFee.overdueRenewNow']()}
			{:else if fee.kind === 'expiring'}
				{fee.daysLeft === 0
					? m['HostMyAccommodationsPage.MyAccommodationsTableListingFee.expiresToday']()
					: m['HostMyAccommodationsPage.MyAccommodationsTableListingFee.expiresInDays']({
							days: fee.daysLeft
						})}
			{:else if fee.daysLeft === null}
				<!-- A "forever" grant: no countdown, and "Until 2100" would be noise. -->
				{m['HostMyAccommodationsPage.MyAccommodationsTableListingFee.coveredForever']()}
			{:else}
				{m['HostMyAccommodationsPage.MyAccommodationsTableListingFee.untilDate']({
					date: formatDate(fee.expiresAt)
				})}
			{/if}
		</span>

		<!-- Renewal is one click from the row a host is already looking at. Outside the
		     grace/expiring window there is nothing to nag about. -->
		{#if fee.kind !== 'active'}
			<MyAccommodationsTableRenewButton apartmentId={row._id} />
		{/if}
	{/if}
</div>
