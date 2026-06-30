<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';

	// CONFIG
	import { ACCOMMODATION_TYPES } from '@/shared/data/accommodationsData';
	import {
		PROTECTED_PAGE_ENDPOINTS,
		UNPROTECTED_PAGE_ENDPOINTS
	} from '@/shared/routeEndpoints';

	// COMPONENTS
	import DataTable from '@/shared/components/ui/data-table/convex-data-table.svelte';
	import { Button } from '@/shared/components/ui/button/index.js';

	// UTILS
	import { formatCurrency } from '@/utils/formatters';
	import { appGoto } from '@/utils/app-navigation';

	// TYPES
	import type { typesAccommodation } from '@/shared/features/accommodation/types/accommodationTypes';
	import type { typesAccommodationStatus } from '@/shared/features/accommodation/types/accommodationTypes';
	import type {
		ColumnDef,
		DataTableCellSnippetProps,
		DataTableSortDirection
	} from '@/shared/components/ui/data-table/types.js';

	// LUCIDE ICONS
	import ImageIcon from '@lucide/svelte/icons/image';
	import EyeIcon from '@lucide/svelte/icons/eye';
	import SquarePenIcon from '@lucide/svelte/icons/square-pen';

	let sortColumn = $state<string | undefined>('createdAt');
	let sortDirection = $state<DataTableSortDirection | undefined>('desc');

	const propertyTypeLabels = new Map(ACCOMMODATION_TYPES.map((type) => [type.value, type.label]));

	const columns: ColumnDef<typesAccommodation>[] = [
		{
			id: 'title',
			header: 'Listing',
			accessor: (row) => row.title,
			cellClass: 'min-w-64'
		},
		{
			id: 'status',
			header: 'Status',
			accessor: (row) => statusLabel(row.status),
			hideBelow: 'md'
		},
		{
			id: 'payment',
			header: 'Payment',
			accessor: (row) => (row.paidAt ? 'Paid' : 'Unpaid'),
			hideBelow: 'lg'
		},
		{
			id: 'price',
			header: 'Price',
			accessor: (row) => row.discountAmount || row.pricePerNight,
			hideBelow: 'md'
		},
		{
			id: 'capacity',
			header: 'Capacity',
			accessor: (row) => row.maxGuests,
			hideBelow: 'lg'
		},
		{
			id: 'createdAt',
			header: 'Created',
			accessor: (row) => formatDate(row._creationTime),
			sortable: true,
			hideBelow: 'lg'
		},
		{
			id: 'actions',
			header: '',
			accessor: () => null,
			cellClass: 'w-0',
			wrap: true
		}
	];

	function statusLabel(status: typesAccommodationStatus): string {
		switch (status) {
			case 'pending_review':
				return 'Pending review';
			case 'published':
				return 'Published';
			case 'suspended':
				return 'Suspended';
			case 'archived':
				return 'Archived';
		}
	}

	function statusClass(status: typesAccommodationStatus): string {
		switch (status) {
			case 'pending_review':
				return 'bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300';
			case 'published':
				return 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300';
			case 'suspended':
				return 'bg-destructive/10 text-destructive ring-destructive/20';
			case 'archived':
				return 'bg-muted text-muted-foreground ring-border';
		}
	}

	function formatDate(timestamp: number): string {
		return new Intl.DateTimeFormat('en', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		}).format(new Date(timestamp));
	}

	function propertyTypeLabel(type: typesAccommodation['type']): string {
		return propertyTypeLabels.get(type) ?? type;
	}
</script>

<DataTable
	query={api.tables.accommodations.queries.fetchMyAccommodations.fetchMyAccommodations}
	{columns}
	getRowId={(row) => row._id}
	customCells={{
		title: listingCell,
		status: statusCell,
		payment: paymentCell,
		price: priceCell,
		capacity: capacityCell,
		createdAt: createdAtCell,
		actions: actionsCell
	}}
	bind:sortColumn
	bind:sortDirection
	pageSize={8}
	borderless
/>

{#snippet listingCell({ row }: DataTableCellSnippetProps<typesAccommodation>)}
	<div class="flex min-w-0 items-center gap-3">
		<div class="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted ring-1 ring-border">
			{#if row.images[0]?.url}
				<img
					src={row.images[0].url}
					alt={row.images[0].alt ?? row.title}
					class="size-full object-cover"
					loading="lazy"
				/>
			{:else}
				<div class="flex size-full items-center justify-center text-muted-foreground">
					<ImageIcon class="size-5" aria-hidden="true" />
				</div>
			{/if}
		</div>

		<div class="min-w-0 space-y-1">
			<p class="truncate text-sm font-medium">{row.title}</p>
			<p class="truncate text-xs text-muted-foreground">
				{propertyTypeLabel(row.type)}
				{#if row.city}
					in {row.city}
				{/if}
			</p>
		</div>
	</div>
{/snippet}

{#snippet statusCell({ row }: DataTableCellSnippetProps<typesAccommodation>)}
	<span
		class={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${statusClass(row.status)}`}
	>
		{statusLabel(row.status)}
	</span>
{/snippet}

{#snippet paymentCell({ row }: DataTableCellSnippetProps<typesAccommodation>)}
	<span class="text-sm text-muted-foreground">
		{row.paidAt ? `Paid ${formatDate(row.paidAt)}` : 'Unpaid'}
	</span>
{/snippet}

{#snippet priceCell({ row }: DataTableCellSnippetProps<typesAccommodation>)}
	<div class="flex flex-col">
		<span class="text-sm font-medium"
			>{formatCurrency(row.discountAmount || row.pricePerNight)}</span
		>
		{#if row.discountAmount}
			<span class="text-xs text-muted-foreground line-through"
				>{formatCurrency(row.pricePerNight)}</span
			>
		{/if}
	</div>
{/snippet}

{#snippet capacityCell({ row }: DataTableCellSnippetProps<typesAccommodation>)}
	<span class="text-sm text-muted-foreground">
		{row.maxGuests} guests, {row.bedrooms} bedrooms
	</span>
{/snippet}

{#snippet createdAtCell({ row }: DataTableCellSnippetProps<typesAccommodation>)}
	<span class="text-sm text-muted-foreground">{formatDate(row._creationTime)}</span>
{/snippet}

{#snippet actionsCell({ row }: DataTableCellSnippetProps<typesAccommodation>)}
	<div class="flex items-center justify-end gap-1">
		<Button
			onclick={() => appGoto(UNPROTECTED_PAGE_ENDPOINTS.ACCOMMODATION.replace(':slug', row.slug))}
			variant="ghost"
			size="icon-sm"
			aria-label="View listing"
			title="View"
		>
			<EyeIcon class="size-4" aria-hidden="true" />
		</Button>
		<Button
			onclick={() => appGoto(PROTECTED_PAGE_ENDPOINTS.EDIT_ACCOMMODATION.replace(':id', row._id))}
			variant="ghost"
			size="icon-sm"
			aria-label="Edit listing"
			title="Edit"
		>
			<SquarePenIcon class="size-4" aria-hidden="true" />
		</Button>
	</div>
{/snippet}
