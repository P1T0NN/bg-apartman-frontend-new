// DATA
import { BOOKING_STATUS_CONFIG, PAYMENT_STATUS_CONFIG } from '@/features/bookings/data/bookingsData';

// TYPES
import type { ColumnDef } from '@/components/ui/data-table/types.js';
import type {
	typesBookingSafe,
	typesBookingFilterCounts
} from '@/shared/features/booking/types/bookingTypes';

/** Tab counts before the first payload lands — every filter reads 0, never `undefined`. */
export const EMPTY_COUNTS: typesBookingFilterCounts = {
	all: 0,
	pending: 0,
	confirmed: 0,
	checked_in: 0,
	checked_out: 0,
	withdrawn: 0,
	declined: 0,
	auto_declined: 0,
	cancelled: 0
};

/**
 * Column definitions for the shared bookings table (host reservations + guest my-bookings).
 * `accessor` is the plain-text value — sorting, search matching and the mobile card fallback
 * read it; the rendered cell comes from the table's `customCells` snippets.
 */
export const BOOKINGS_TABLE_COLUMNS: ColumnDef<typesBookingSafe>[] = [
	{
		id: 'guest',
		header: 'Guest',
		accessor: (r) => `${r.guestFirstName} ${r.guestLastName}`,
		cellClass: 'min-w-[15rem]',
		wrap: true
	},
	{
		id: 'apartment',
		header: 'Property',
		accessor: (r) => r.apartment.title,
		hideBelow: 'sm',
		wrap: true
	},
	{ id: 'stay', header: 'Stay', accessor: (r) => r.checkInDate, sortable: true, wrap: true },
	{
		id: 'guests',
		header: 'Guests',
		accessor: (r) => `${r.numberOfAdults + r.numberOfChildren}`,
		hideBelow: 'lg'
	},
	{
		id: 'status',
		header: 'Status',
		accessor: (r) => BOOKING_STATUS_CONFIG[r.status].label,
		wrap: true
	},
	{
		id: 'payment',
		header: 'Payment',
		accessor: (r) => PAYMENT_STATUS_CONFIG[r.paymentStatus].label,
		hideBelow: 'lg',
		wrap: true
	},
	{ id: 'total', header: 'Total', accessor: (r) => r.total, sortable: true },
	{ id: 'actions', header: '', accessor: () => '', hideBelow: 'md', cellClass: 'w-12 text-right' }
];
