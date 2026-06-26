// TYPES
import type {
	BookingFilterOption,
	BookingStatusConfig,
	PaymentStatusConfig
} from '@/features/bookings/types/bookingsTypes';

export const BOOKING_STATUS_CONFIG: BookingStatusConfig = {
	pending: {
		label: 'Pending',
		badgeClass: 'bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300',
		dotClass: 'bg-amber-500'
	},
	confirmed: {
		label: 'Confirmed',
		badgeClass: 'bg-blue-500/10 text-blue-700 ring-blue-500/20 dark:text-blue-300',
		dotClass: 'bg-blue-500'
	},
	checked_in: {
		label: 'Checked in',
		badgeClass: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300',
		dotClass: 'bg-emerald-500'
	},
	checked_out: {
		label: 'Checked out',
		badgeClass: 'bg-muted text-muted-foreground ring-border',
		dotClass: 'bg-muted-foreground'
	},
	cancelled: {
		label: 'Cancelled',
		badgeClass: 'bg-destructive/10 text-destructive ring-destructive/20',
		dotClass: 'bg-destructive'
	}
};

export const PAYMENT_STATUS_CONFIG: PaymentStatusConfig = {
	paid: {
		label: 'Paid',
		badgeClass: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300',
		dotClass: 'bg-emerald-500'
	},
	pending: {
		label: 'Unpaid',
		badgeClass: 'bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300',
		dotClass: 'bg-amber-500'
	},
	refunded: {
		label: 'Refunded',
		badgeClass: 'bg-muted text-muted-foreground ring-border',
		dotClass: 'bg-muted-foreground'
	}
};

/** Host workflow filters — each maps 1:1 to a booking status (plus "all"). */
export const BOOKING_FILTERS: BookingFilterOption[] = [
	{ value: 'all', label: 'All' },
	{ value: 'pending', label: 'Requests' },
	{ value: 'confirmed', label: 'Upcoming' },
	{ value: 'checked_in', label: 'Hosting now' },
	{ value: 'checked_out', label: 'Checked out' },
	{ value: 'cancelled', label: 'Cancelled' }
];
