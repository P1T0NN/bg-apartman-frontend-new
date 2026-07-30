<script lang="ts">
	// COMPONENTS
	import MyAccommodationsTableRenewButton from './my-accommodations-table-renew-button.svelte';

	// UTILS
	import { formatDate } from '@/utils/formatters';
	import { cn } from '@/utils/utils.js';
	import { listingFeeState } from '@/shared/features/accommodation/utils/listingFeeState';

	// TYPES
	import type { typesAccommodation } from '@/shared/features/accommodation/types/accommodationTypes';

	let { row }: { row: typesAccommodation } = $props();

	const fee = $derived(listingFeeState(row));
</script>

<div class="flex flex-col gap-1">
	{#if fee.kind === 'inactive'}
		<!-- No period stamped: the mode-flip backfill hasn't reached this row, and the
		     sweep leaves it alone until it does. Nothing to bill, nothing to say. -->
		<span class="text-sm text-muted-foreground">—</span>
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
