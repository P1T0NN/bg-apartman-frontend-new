// LIBRARIES
import { m } from '@/shared/lib/paraglide/messages';

// TYPES
import type {
	typesBookingFilterOption,
	typesBookingStatusConfig,
	typesPaymentStatusConfig
} from '@/shared/features/booking/types/bookingTypes';

export const BOOKING_STATUS_CONFIG: typesBookingStatusConfig = {
	pending: {
		label: m['BookingsStatus.pending'](),
		badgeClass: 'bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300',
		dotClass: 'bg-amber-500'
	},
	confirmed: {
		label: m['BookingsStatus.confirmed'](),
		badgeClass: 'bg-blue-500/10 text-blue-700 ring-blue-500/20 dark:text-blue-300',
		dotClass: 'bg-blue-500'
	},
	checked_in: {
		label: m['BookingsStatus.checkedIn'](),
		badgeClass: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300',
		dotClass: 'bg-emerald-500'
	},
	checked_out: {
		label: m['BookingsStatus.checkedOut'](),
		badgeClass: 'bg-muted text-muted-foreground ring-border',
		dotClass: 'bg-muted-foreground'
	},
	declined: {
		label: m['BookingsStatus.declined'](),
		badgeClass: 'bg-destructive/10 text-destructive ring-destructive/20',
		dotClass: 'bg-destructive'
	},
	auto_declined: {
		label: m['BookingsStatus.autoDeclined'](),
		badgeClass: 'bg-muted text-muted-foreground ring-border',
		dotClass: 'bg-muted-foreground'
	},
	cancelled: {
		label: m['BookingsStatus.cancelled'](),
		badgeClass: 'bg-destructive/10 text-destructive ring-destructive/20',
		dotClass: 'bg-destructive'
	}
};

export const PAYMENT_STATUS_CONFIG: typesPaymentStatusConfig = {
	paid: {
		label: m['BookingPaymentStatus.paid'](),
		badgeClass: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300',
		dotClass: 'bg-emerald-500'
	},
	pending: {
		label: m['BookingPaymentStatus.unpaid'](),
		badgeClass: 'bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300',
		dotClass: 'bg-amber-500'
	},
	refunded: {
		label: m['BookingPaymentStatus.refunded'](),
		badgeClass: 'bg-muted text-muted-foreground ring-border',
		dotClass: 'bg-muted-foreground'
	}
};

/** Host workflow filters — each maps 1:1 to a booking status (plus "all"). */
export const BOOKING_FILTERS: typesBookingFilterOption[] = [
	{ value: 'all', label: m['BookingFilters.all']() },
	{ value: 'pending', label: m['BookingFilters.requests']() },
	{ value: 'confirmed', label: m['BookingFilters.upcoming']() },
	{ value: 'checked_in', label: m['BookingFilters.hostingNow']() },
	{ value: 'checked_out', label: m['BookingFilters.checkedOut']() },
	{ value: 'cancelled', label: m['BookingFilters.cancelled']() }
];
