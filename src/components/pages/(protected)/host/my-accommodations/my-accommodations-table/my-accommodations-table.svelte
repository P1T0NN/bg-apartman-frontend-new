<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';

	// COMPONENTS
	import ConvexDataTable from '@/components/ui/data-table/convex-data-table.svelte';
	import { FeatureStatus } from '@/components/ui/feature-status/index.js';
	import MyAccommodationsTableAccommodationInfo from './my-accommodations-table-accommodation-info.svelte';
	import MyAccommodationsTableListingFee from './my-accommodations-table-listing-fee.svelte';
	import MyAccommodationsTableActions from './my-accommodations-table-actions.svelte';
	import MyAccommodationsTableFilters from './my-accommodations-table-filters.svelte';

	// DATA
	import { ACCOMMODATION_STATUS_CONFIG } from '@/features/accommodations/data/accommodationsData';
	import { MY_ACCOMMODATIONS_TABLE_COLUMNS } from './myAccommodationsTableData';

	// UTILS
	import { formatCurrency, formatDate } from '@/utils/formatters';

	// TYPES
	import type {
		typesAccommodation,
		typesAccommodationStatus
	} from '@/shared/features/accommodation/types/accommodationTypes';
	import type {
		DataTableCellSnippetProps,
		DataTableSortDirection
	} from '@/components/ui/data-table/types.js';

	let sortColumn = $state<string | undefined>('createdAt');
	let sortDirection = $state<DataTableSortDirection | undefined>('desc');

	// Search + status round-trip to the server: both narrow inside an index
	// (`search_title` / `by_host_status`), never a post-scan filter — a host with 100+
	// listings is the case this exists for. "Any status" is expressed by omitting the arg;
	// ConvexDataTable resets to page 1 whenever args change.
	let search = $state('');
	let status = $state<typesAccommodationStatus | undefined>(undefined);

	const listArgs = $derived(status === undefined ? {} : { status });
</script>

<ConvexDataTable
	query={api.tables.accommodations.queries.fetchMyAccommodations.fetchMyAccommodations}
	queryArgs={listArgs}
	columns={MY_ACCOMMODATIONS_TABLE_COLUMNS}
	getRowId={(row) => row._id}
	customCells={{
		title: accommodationCell,
		status: statusCell,
		listingFee: listingFeeCell,
		price: priceCell,
		capacity: capacityCell,
		createdAt: createdAtCell,
		actions: actionsCell
	}}
	bind:sortColumn
	bind:sortDirection
	controlsPlace="top"
	searchable
	bind:search
	searchPlaceholder="Search your listings by title…"
	filters={accommodationFilters}
	pageSize={8}
	borderless
	emptyTitle="No listings match"
	emptyDescription="Try a different search or clear the status filter."
/>

{#snippet accommodationFilters()}
	<MyAccommodationsTableFilters bind:status />
{/snippet}

{#snippet accommodationCell({ row }: DataTableCellSnippetProps<typesAccommodation>)}
	<MyAccommodationsTableAccommodationInfo {row} />
{/snippet}

{#snippet statusCell({ row }: DataTableCellSnippetProps<typesAccommodation>)}
	<FeatureStatus config={ACCOMMODATION_STATUS_CONFIG} status={row.status} />
{/snippet}

{#snippet listingFeeCell({ row }: DataTableCellSnippetProps<typesAccommodation>)}
	<MyAccommodationsTableListingFee {row} />
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
	<MyAccommodationsTableActions {row} />
{/snippet}
