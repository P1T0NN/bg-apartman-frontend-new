<script lang="ts">
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
			Per-booking fee ({ACCOMMODATIONS_CONFIG.BOOKING_FEE.PERCENT}%) — permanent · new listing to
			change plan
		</span>
	{:else if fee.kind === 'inactive'}
		<!-- No model stamped: the flip backfill hasn't reached this row, and the sweep
		     leaves it alone until it does. Nothing to bill, nothing to say. -->
		<span class="text-sm text-muted-foreground">—</span>
	{:else if fee.kind === 'unpaid'}
		<!-- The first payment gates going live (ASD §8) — say so where the host looks. -->
		<span class="text-sm font-medium text-foreground">
			Listing fee not paid — pay €{ACCOMMODATIONS_CONFIG.LISTING_FEE.AMOUNT} to go live
		</span>
		<MyAccommodationsTableRenewButton apartmentId={row._id} label="Pay now" />
	{:else}
		<span
			class={cn(
				'text-sm',
				fee.kind === 'active' ? 'text-muted-foreground' : 'font-medium text-foreground'
			)}
		>
			{#if fee.kind === 'lapsed'}
				Expired
			{:else if fee.kind === 'grace'}
				Overdue — renew now
			{:else if fee.kind === 'expiring'}
				{fee.daysLeft === 0 ? 'Expires today' : `Expires in ${fee.daysLeft} days`}
			{:else if fee.daysLeft === null}
				<!-- A "forever" grant: no countdown, and "Until 2100" would be noise. -->
				Covered forever
			{:else}
				Until {formatDate(fee.expiresAt)}
			{/if}
		</span>

		<!-- Renewal is one click from the row a host is already looking at. Outside the
		     grace/expiring window there is nothing to nag about. -->
		{#if fee.kind !== 'active'}
			<MyAccommodationsTableRenewButton apartmentId={row._id} />
		{/if}
	{/if}
</div>
