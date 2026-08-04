<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';

	// COMPONENTS
	import ConvexDataTable from '@/components/ui/data-table/convex-data-table.svelte';
	import { Card } from '@/components/ui/card/index.js';
	import AdminReportsTableFilters from './admin-reports-table-filters.svelte';
	import AdminReportsTableActions from './admin-reports-table-actions.svelte';
	import AdminReportDetail from './admin-report-detail.svelte';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// DATA
	import { ADMIN_REPORTS_TABLE_COLUMNS } from './adminReportsTableData';
	import { REPORT_CATEGORY_TONE } from '@/features/reports/data/reportsData';

	// TYPES
	import type { DataTableCellSnippetProps } from '@/components/ui/data-table/types';
	import type { AdminReportRow } from '@/convex/tables/reports/queries/listReportsSafe';
	import type { ReportCategory } from '@/shared/features/report/schemas/reportsSchemas';

	/**
	 * The whole reports surface: filters, table, the row disclosure that carries the report
	 * text, and the resolve/reopen action. Self-contained so the page file stays a header
	 * plus this — the state below exists only to scope the query and its empty-state copy.
	 *
	 * The table owns the subscription — reports arrive from the public while the admin reads
	 * the inbox, the same live case as the dashboard's feedback band.
	 */
	let view = $state<'new' | 'all'>('new');
	let category = $state<ReportCategory | undefined>(undefined);

	const queryArgs = $derived({
		...(view === 'new' ? { status: 'new' as const } : {}),
		...(category !== undefined ? { category } : {})
	});
</script>

<!-- Offset query (slices by `page`, returns an exact `totalCount`) — the cursor default
     would re-serve the first slice on every page and never end. -->
<!-- realtime: users file reports while staff are on this screen, and status is set from it. -->
<ConvexDataTable
	realtime
	caption="Reports"
	query={api.tables.reports.queries.listReportsSafe.listReportsSafe}
	optimizationStrategy="offset"
	controlsPlace="top"
	{queryArgs}
	columns={ADMIN_REPORTS_TABLE_COLUMNS}
	getRowId={(r) => r._id}
	getRowLabel={(r) => `${REPORT_CATEGORY_TONE[r.category].label} report`}
	customCells={{ category: categoryCell, status: statusCell, actions: actionsCell }}
	{expandedContent}
	{filters}
	emptyTitle={view === 'new' ? 'Nothing new. All caught up.' : 'No reports yet.'}
	emptyDescription={view === 'new'
		? 'New reports land here the moment someone files one.'
		: 'Nobody has filed a report yet.'}
	{errorContent}
/>

{#snippet filters()}
	<AdminReportsTableFilters bind:view bind:category />
{/snippet}

{#snippet categoryCell({ row }: DataTableCellSnippetProps<AdminReportRow>)}
	{@const tone = REPORT_CATEGORY_TONE[row.category]}
	<span
		class={cn(
			'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
			tone.badgeClass
		)}
	>
		{tone.label}
	</span>
{/snippet}

{#snippet statusCell({ row }: DataTableCellSnippetProps<AdminReportRow>)}
	{#if row.status === 'resolved'}
		<span class="rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
			Resolved
		</span>
	{:else}
		<span class="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">New</span>
	{/if}
{/snippet}

{#snippet actionsCell({ row }: DataTableCellSnippetProps<AdminReportRow>)}
	<AdminReportsTableActions report={row} />
{/snippet}

{#snippet expandedContent({ row }: { row: AdminReportRow })}
	<AdminReportDetail report={row} />
{/snippet}

{#snippet errorContent()}
	<Card class="p-8 text-center">
		<p class="text-sm text-muted-foreground">Could not load reports. Try refreshing the page.</p>
	</Card>
{/snippet}
