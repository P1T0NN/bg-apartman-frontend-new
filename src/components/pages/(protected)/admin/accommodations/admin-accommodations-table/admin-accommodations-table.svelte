<script lang="ts">
	// I18N
	import { m } from '@/lib/paraglide/messages';

	// SVELTEKIT IMPORTS
	import { page } from '$app/state';

	// LIBRARIES
	import { api } from '@/convex/_generated/api';

	// COMPONENTS
	import ConvexDataTable from '@/components/ui/data-table/convex-data-table.svelte';
	import AdminAccommodationsFilters from '../admin-accommodations-filters.svelte';
	import AdminAccommodationsTableStatus from './admin-accommodations-table-status.svelte';
	import AdminAccommodationsTableActions from './admin-accommodations-table-actions.svelte';

	// UTILS
	import { formatCurrency } from '@/utils/formatters';

	// DATA
	import { ADMIN_ACCOMMODATIONS_TABLE_COLUMNS } from './adminAccommodationsTableData';

	// TYPES
	import type { DataTableCellSnippetProps } from '@/components/ui/data-table/types.js';
	import type { AdminAccommodationRow } from '@/shared/features/accommodation/types/accommodationTypes';
	import type {
		typesAccommodationStatus,
		typesAccommodationType
	} from '@/shared/features/accommodation/types/accommodationTypes';

	// LUCIDE ICONS
	import ImageIcon from '@lucide/svelte/icons/image';
	import StarIcon from '@lucide/svelte/icons/star';

	/**
	 * The whole `/admin/accommodations` surface: every listing on the platform, with the
	 * moderation actions on the row (AdminPagesSystemDesign.md §2).
	 *
	 * There is no separate review queue — reviewing is this table filtered to
	 * `pending_review`, which the sidebar badge already tells the admin to do. One
	 * subscription, one place the actions live.
	 */

	// `hostId` arrives as a URL param from the user-detail page's "View listings" cross-link
	// (APSD §5) — filter state lives in the URL so a filtered view is a shareable link.
	const hostId = $derived(page.url.searchParams.get('hostId') ?? undefined);

	let status = $state<typesAccommodationStatus | undefined>(undefined);
	let type = $state<typesAccommodationType | undefined>(undefined);
	let sortColumn = $state<string | undefined>(undefined);
	let sortDirection = $state<'asc' | 'desc' | undefined>(undefined);
	let search = $state<string>('');

	const queryArgs = $derived({
		...(status !== undefined && { status }),
		...(type !== undefined && { type }),
		...(hostId !== undefined && { hostId })
	});
</script>

<!-- Offset query (slices by `page`, returns an exact `totalCount`) — the cursor default
     would re-serve the first slice on every page and never end. -->
<ConvexDataTable
	caption={m['AdminAccommodationsPage.AdminAccommodationsTable.allListings']()}
	query={api.tables.accommodations.queries.listAccommodationsAdmin.listAccommodationsAdmin}
	optimizationStrategy="offset"
	controlsPlace="top"
	{queryArgs}
	columns={ADMIN_ACCOMMODATIONS_TABLE_COLUMNS}
	getRowId={(r) => r._id}
	customCells={{ title: titleCell, price: priceCell, status: statusCell, actions: actionsCell }}
	bind:sortColumn
	bind:sortDirection
	searchable
	bind:search
	searchPlaceholder={m['AdminAccommodationsPage.AdminAccommodationsTable.searchByTitle']()}
	{filters}
/>

{#snippet filters()}
	<AdminAccommodationsFilters bind:status bind:type />
{/snippet}

{#snippet titleCell({ row }: DataTableCellSnippetProps<AdminAccommodationRow>)}
	<div class="flex min-w-0 items-center gap-3">
		<div class="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted ring-1 ring-border">
			{#if row.imageUrl}
				<img src={row.imageUrl} alt="" class="size-full object-cover" loading="lazy" />
			{:else}
				<div class="flex size-full items-center justify-center text-muted-foreground">
					<ImageIcon class="size-4" aria-hidden="true" />
				</div>
			{/if}
		</div>

		<div class="min-w-0">
			<p class="flex items-center gap-1.5 truncate text-sm font-medium">
				{row.title}
				{#if row.isFeatured}
					<StarIcon
						class="size-3.5 shrink-0 fill-amber-500 text-amber-500"
						aria-label={m['AdminAccommodationsPage.AdminAccommodationsTable.featuredOnHomepage']()}
					/>
				{/if}
			</p>
			<p class="truncate text-xs text-muted-foreground">{row.city}</p>
		</div>
	</div>
{/snippet}

{#snippet priceCell({ row }: DataTableCellSnippetProps<AdminAccommodationRow>)}
	<span class="tabular-nums">{formatCurrency(row.pricePerNight)}</span>
{/snippet}

{#snippet statusCell({ row }: DataTableCellSnippetProps<AdminAccommodationRow>)}
	<AdminAccommodationsTableStatus {row} />
{/snippet}

{#snippet actionsCell({ row }: DataTableCellSnippetProps<AdminAccommodationRow>)}
	<AdminAccommodationsTableActions {row} />
{/snippet}
