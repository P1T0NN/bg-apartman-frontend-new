// I18N
import { m } from '@/paraglide/messages';

// DATA
import { REPORT_CATEGORY_TONE, reportAgo } from '@/features/reports/data/reportsData';

// TYPES
import type { ColumnDef } from '@/components/ui/data-table/types.js';
import type { AdminReportRow } from '@/convex/tables/reports/queries/listReportsSafe';

/**
 * Columns for the `/admin/reports` inbox.
 *
 * The message column carries a one-line preview only: reports are prose, and prose dies in
 * table cells (AdminPagesSystemDesign.md §4). The full text lives in the row's disclosure,
 * which is what the reader opens once a preview looks worth reading.
 */
export const ADMIN_REPORTS_TABLE_COLUMNS: ColumnDef<AdminReportRow>[] = [
	{
		id: 'category',
		header: m['AdminReportsPage.AdminReportsTableData.category'](),
		accessor: (row) => REPORT_CATEGORY_TONE[row.category].label,
		cellClass: 'w-40'
	},
	{
		id: 'message',
		header: m['AdminReportsPage.AdminReportsTableData.report'](),
		accessor: (row) => row.message,
		cellClass: 'min-w-[18rem]'
	},
	{
		id: 'received',
		header: m['AdminReportsPage.AdminReportsTableData.received'](),
		accessor: (row) => reportAgo(row._creationTime),
		hideBelow: 'md',
		cellClass: 'w-32 text-muted-foreground'
	},
	{
		id: 'status',
		header: m['AdminReportsPage.AdminReportsTableData.status'](),
		accessor: (row) =>
			row.status === 'resolved'
				? m['AdminReportsPage.AdminReportsTableData.resolved']()
				: m['AdminReportsPage.AdminReportsTableData.new'](),
		hideBelow: 'sm',
		cellClass: 'w-28'
	},
	{
		id: 'actions',
		header: '',
		accessor: () => '',
		cellClass: 'w-28 text-right'
	}
];
