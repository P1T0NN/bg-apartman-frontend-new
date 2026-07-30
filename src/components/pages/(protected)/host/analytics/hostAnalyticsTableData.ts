// UTILS
import { formatCurrency, formatDateShort } from '@/utils/formatters';

// TYPES
import type { ColumnDef } from '@/components/ui/data-table/types.js';
import type { HostAccommodationRow } from '@/convex/pages/host/analytics/types/hostAnalyticsTypes';

/**
 * Columns for the "By accommodation" table. Only the accommodation cell needs a snippet
 * (image + link); the three number columns render straight from their accessor, which is
 * also what the mobile card layout reads.
 *
 * No `sortable` flags: sort here is a server access-pattern concern, and this query already
 * returns rows best-occupancy-first — the answer to "which of my places is carrying me".
 */
export const HOST_ANALYTICS_TABLE_COLUMNS: ColumnDef<HostAccommodationRow>[] = [
	{
		id: 'title',
		header: 'Accommodation',
		accessor: (row) => row.title,
		cellClass: 'min-w-48'
	},
	{
		id: 'occupancy',
		header: 'Occupancy',
		accessor: (row) => `${Math.round(row.occupancyPct)}%`,
		headerClass: 'text-right',
		cellClass: 'text-right tabular-nums'
	},
	{
		id: 'revenue',
		header: 'Revenue',
		accessor: (row) => formatCurrency(row.revenue),
		headerClass: 'text-right',
		cellClass: 'text-right tabular-nums'
	},
	{
		id: 'nextCheckIn',
		header: 'Next check-in',
		accessor: (row) => (row.nextCheckIn ? formatDateShort(row.nextCheckIn) : '—'),
		hideBelow: 'sm',
		headerClass: 'text-right',
		cellClass: 'text-right text-muted-foreground'
	}
];
