// DATA
import { ACCOMMODATION_STATUS_CONFIG } from '@/features/accommodations/data/accommodationsData';

// TYPES
import type { ColumnDef } from '@/components/ui/data-table/types.js';
import type { AdminAccommodationRow } from '@/convex/tables/accommodations/queries/listAccommodationsAdmin';

/**
 * Columns for the `/admin/accommodations` listings table (AdminPagesSystemDesign.md §2).
 *
 * This table is the page's only zone — reviewing is the same table filtered to
 * `pending_review`, which is why there is no separate queue and no second subscription.
 *
 * `accessor` is the sort key and plain-text fallback; the rich cells (thumbnail, status
 * chip, action row) are rendered by the table's `customCells` snippets.
 */
export const ADMIN_ACCOMMODATIONS_TABLE_COLUMNS: ColumnDef<AdminAccommodationRow>[] = [
	{ id: 'title', header: 'Listing', accessor: (r) => r.title, cellClass: 'min-w-64' },
	{ id: 'host', header: 'Host', accessor: (r) => r.hostName, hideBelow: 'md' },
	{ id: 'city', header: 'City', accessor: (r) => r.city, hideBelow: 'lg' },
	{ id: 'type', header: 'Type', accessor: (r) => r.type, hideBelow: 'lg' },
	{
		id: 'price',
		header: 'Price',
		accessor: (r) => r.pricePerNight,
		sortable: true,
		hideBelow: 'md'
	},
	{
		id: 'status',
		header: 'Status',
		accessor: (r) => ACCOMMODATION_STATUS_CONFIG[r.status].label,
		wrap: true
	},
	{
		id: 'createdAt',
		header: 'Created',
		accessor: (r) => new Date(r._creationTime).toLocaleDateString(),
		sortable: true,
		hideBelow: 'lg'
	},
	{ id: 'actions', header: '', accessor: () => null, cellClass: 'w-0', wrap: true }
];
