<script lang="ts">
	// I18N
	import { m } from '@/paraglide/messages';

	// CONFIG
	import { PROTECTED_PAGE_ENDPOINTS } from '@/config/routeEndpoints';

	// UTILS
	import { appHref } from '@/utils/app-navigation.js';

	// COMPONENTS
	import DataTable from '@/components/ui/data-table/data-table.svelte';

	// DATA
	import { HOST_ANALYTICS_TABLE_COLUMNS } from './hostAnalyticsTableData';

	// TYPES
	import type { HostAccommodationRow } from '@/convex/pages/host/analytics/types/hostAnalyticsTypes';
	import type { DataTableCellSnippetProps } from '@/components/ui/data-table/types.js';

	// LUCIDE ICONS
	import ImageIcon from '@lucide/svelte/icons/image';

	/**
	 * The host's published listings over the page's selected period, best occupancy first
	 * (HostSystemDesign.md §2b) — "which of my places is carrying me". Titles link to the
	 * listing's edit page: the host's next move after seeing a weak row is changing price or
	 * photos, and that lives there.
	 *
	 * The rows arrive whole from the page's live analytics query, so this is the plain
	 * `DataTable` (not the Convex one) with its pager off — there is nothing to page through.
	 */
	let { rows }: { rows: HostAccommodationRow[] } = $props();

	function editHref(id: string): string {
		return appHref(PROTECTED_PAGE_ENDPOINTS.EDIT_ACCOMMODATION.replace(':id', id));
	}
</script>

<section class="flex flex-col gap-3">
	<h2 class="text-base font-semibold tracking-tight">
		{m['HostAnalyticsPage.HostAnalyticsPerAccommodationTable.byAccommodation']()}
	</h2>

	<DataTable
		caption={m['HostAnalyticsPage.HostAnalyticsPerAccommodationTable.byAccommodation']()}
		data={rows}
		columns={HOST_ANALYTICS_TABLE_COLUMNS}
		getRowId={(row) => row.apartmentId}
		customCells={{ title: accommodationCell }}
		showPagination={false}
	/>
</section>

{#snippet accommodationCell({ row }: DataTableCellSnippetProps<HostAccommodationRow>)}
	<a href={editHref(row.apartmentId)} class="flex min-w-0 items-center gap-3 hover:underline">
		<div class="size-10 shrink-0 overflow-hidden rounded-md bg-muted ring-1 ring-border">
			{#if row.imageUrl}
				<img src={row.imageUrl} alt="" class="size-full object-cover" loading="lazy" />
			{:else}
				<div class="flex size-full items-center justify-center text-muted-foreground">
					<ImageIcon class="size-4" aria-hidden="true" />
				</div>
			{/if}
		</div>
		<span class="truncate text-sm font-medium">{row.title}</span>
	</a>
{/snippet}
