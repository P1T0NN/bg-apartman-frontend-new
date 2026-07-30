// DATA
import { ACCOMMODATION_STATUS_CONFIG } from '@/features/accommodations/data/accommodationsData';

// UTILS
import { formatDate } from '@/utils/formatters';
import { listingFeeModeActive } from '@/shared/features/accommodation/utils/listingFeeState';

// TYPES
import type { ColumnDef } from '@/components/ui/data-table/types.js';
import type { typesAccommodation } from '@/shared/features/accommodation/types/accommodationTypes';

/** Evaluated once — the mode is a deploy-time constant, not a runtime value. */
const LISTING_FEE_MODE = listingFeeModeActive();

export const MY_ACCOMMODATIONS_TABLE_COLUMNS: ColumnDef<typesAccommodation>[] = [
	{
		id: 'title',
		header: 'Accommodation',
		accessor: (row) => row.title,
		cellClass: 'min-w-64'
	},
	{
		id: 'status',
		header: 'Status',
		accessor: (row) => ACCOMMODATION_STATUS_CONFIG[row.status].label,
		hideBelow: 'md'
	},
	// Billing is per listing, so renewal state lives on the row — never on the dashboard
	// (HostSystemDesign.md §5.2). The whole column disappears outside `listing_fee` mode:
	// legacy rows carry `paidAt` stamps from the old bank integration, and showing them a
	// billing UI the platform isn't running would be a lie
	// (AccommodationsSystemDesign.md §8, § FOR LLMs 4).
	...(LISTING_FEE_MODE
		? ([
				{
					id: 'listingFee',
					header: 'Listing',
					accessor: (row) => row.apartmentSubscriptionExpiryDate ?? 0,
					hideBelow: 'lg'
				}
			] as ColumnDef<typesAccommodation>[])
		: []),
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
