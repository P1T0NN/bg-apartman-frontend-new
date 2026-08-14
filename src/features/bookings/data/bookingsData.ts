// I18N
import { m } from '@/paraglide/messages';

// CONFIG
import { UNPROTECTED_PAGE_ENDPOINTS } from '@/config/routeEndpoints';

// TYPES
import type { typesFeatureStatusHelp } from '@/components/ui/feature-status/types';
import type { typesBookingFilterOption } from '@/shared/features/booking/types/bookingTypes';
import type {
	typesBookingStatusConfig,
	typesPaymentStatusConfig
} from '@/features/bookings/types/bookingsSvelteOnlyTypes';

/**
 * The "?" link appended to a booking status where the reader may not know what it means
 * (guest-facing surfaces). Omit it where the page already explains itself — the status
 * guide itself, or a host's own queue.
 */
export const BOOKING_STATUS_HELP: typesFeatureStatusHelp = {
	href: UNPROTECTED_PAGE_ENDPOINTS.BOOKING_STATUS_EXPLANATION,
	ariaLabel: m['bookingsData.statusHelpAria']()
};

export const BOOKING_STATUS_CONFIG: typesBookingStatusConfig = {
	pending: {
		label: m['bookingsData.pending'](),
		badgeClass: 'bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300',
		dotClass: 'bg-amber-500'
	},
	confirmed: {
		label: m['bookingsData.confirmed'](),
		badgeClass: 'bg-blue-500/10 text-blue-700 ring-blue-500/20 dark:text-blue-300',
		dotClass: 'bg-blue-500'
	},
	checked_in: {
		label: m['bookingsData.checkedIn'](),
		badgeClass: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300',
		dotClass: 'bg-emerald-500'
	},
	checked_out: {
		label: m['bookingsData.checkedOut'](),
		badgeClass: 'bg-muted text-muted-foreground ring-border',
		dotClass: 'bg-muted-foreground'
	},
	declined: {
		label: m['bookingsData.declined'](),
		badgeClass: 'bg-destructive/10 text-destructive ring-destructive/20',
		dotClass: 'bg-destructive'
	},
	auto_declined: {
		label: m['bookingsData.expired'](),
		badgeClass: 'bg-muted text-muted-foreground ring-border',
		dotClass: 'bg-muted-foreground'
	},
	// A guest pulling an unanswered request is a non-event — muted, never destructive
	// styling, so it can't read as a loss (BookingSystemDesign.md §2).
	withdrawn: {
		label: m['bookingsData.withdrawn'](),
		badgeClass: 'bg-muted text-muted-foreground ring-border',
		dotClass: 'bg-muted-foreground'
	},
	cancelled: {
		label: m['bookingsData.cancelled'](),
		badgeClass: 'bg-destructive/10 text-destructive ring-destructive/20',
		dotClass: 'bg-destructive'
	}
};

/**
 * Money state, rendered separately from stay state — the two are always two facts, never
 * merged (BookingSystemDesign.md §5). `awaiting` has no entry that users reach in
 * practice: those rows are invisible until the provider confirms, but the map stays
 * exhaustive so a leaked row can never crash a table.
 */
export const PAYMENT_STATUS_CONFIG: typesPaymentStatusConfig = {
	on_arrival: {
		label: m['bookingsData.cashOnArrival'](),
		badgeClass: 'bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300',
		dotClass: 'bg-amber-500'
	},
	awaiting: {
		label: m['bookingsData.awaitingPayment'](),
		badgeClass: 'bg-muted text-muted-foreground ring-border',
		dotClass: 'bg-muted-foreground'
	},
	authorized: {
		label: m['bookingsData.cardHeld'](),
		badgeClass: 'bg-blue-500/10 text-blue-700 ring-blue-500/20 dark:text-blue-300',
		dotClass: 'bg-blue-500'
	},
	paid: {
		label: m['bookingsData.paid'](),
		badgeClass: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300',
		dotClass: 'bg-emerald-500'
	},
	released: {
		label: m['bookingsData.holdReleased'](),
		badgeClass: 'bg-muted text-muted-foreground ring-border',
		dotClass: 'bg-muted-foreground'
	},
	refunded: {
		label: m['bookingsData.refunded'](),
		badgeClass: 'bg-muted text-muted-foreground ring-border',
		dotClass: 'bg-muted-foreground'
	}
};

/** Host workflow filters — each maps 1:1 to a booking status (plus "all"). */
export const BOOKING_FILTERS: typesBookingFilterOption[] = [
	{ value: 'all', label: m['bookingsData.all']() },
	{ value: 'pending', label: m['bookingsData.requests']() },
	{ value: 'confirmed', label: m['bookingsData.upcoming']() },
	{ value: 'checked_in', label: m['bookingsData.hostingNow']() },
	{ value: 'checked_out', label: m['bookingsData.checkedOut']() },
	{ value: 'cancelled', label: m['bookingsData.cancelled']() }
];
