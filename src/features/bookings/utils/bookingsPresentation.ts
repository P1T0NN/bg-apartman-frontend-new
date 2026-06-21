// Presentation helpers shared by the Bookings page components: formatters,
// status/payment styling, the status-filter taxonomy, and the (dummy) action
// state machine. Keeping this logic in one place keeps the components thin and
// guarantees the table, stat cards and detail sheet stay visually consistent.

import type {
	BookingRecord,
	BookingStatus,
	PaymentStatus
} from '@/features/bookings/data/bookingsDummyData';

// === FORMATTERS ==============================================================

const currencyFmt = new Intl.NumberFormat('en', {
	style: 'currency',
	currency: 'EUR',
	maximumFractionDigits: 0
});

export function formatCurrency(amount: number): string {
	return currencyFmt.format(amount);
}

/** "Jun 25, 2026" — used in the detail sheet where the year matters. */
export function formatDate(value: string | number): string {
	return new Intl.DateTimeFormat('en', {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	}).format(new Date(value));
}

/** "Jun 25" — compact form for dense table cells. */
export function formatDateShort(value: string | number): string {
	return new Intl.DateTimeFormat('en', {
		month: 'short',
		day: 'numeric'
	}).format(new Date(value));
}

/** Weekday + date, e.g. "Thu, Jun 25" — used in the sheet's stay timeline. */
export function formatDateWithWeekday(value: string | number): string {
	return new Intl.DateTimeFormat('en', {
		weekday: 'short',
		month: 'short',
		day: 'numeric'
	}).format(new Date(value));
}

export function guestFullName(b: Pick<BookingRecord, 'guestFirstName' | 'guestLastName'>): string {
	return `${b.guestFirstName} ${b.guestLastName}`;
}

export function guestInitials(
	b: Pick<BookingRecord, 'guestFirstName' | 'guestLastName'>
): string {
	return `${b.guestFirstName.charAt(0)}${b.guestLastName.charAt(0)}`.toUpperCase();
}

/** "2 adults · 1 child" — collapses to a single clean phrase. */
export function formatGuests(b: Pick<BookingRecord, 'numberOfAdults' | 'numberOfChildren'>): string {
	const parts: string[] = [`${b.numberOfAdults} ${b.numberOfAdults === 1 ? 'adult' : 'adults'}`];
	if (b.numberOfChildren > 0) {
		parts.push(`${b.numberOfChildren} ${b.numberOfChildren === 1 ? 'child' : 'children'}`);
	}
	return parts.join(' · ');
}

export function formatNights(nights: number): string {
	return `${nights} ${nights === 1 ? 'night' : 'nights'}`;
}

// === STATUS STYLING ==========================================================

type Tone = {
	label: string;
	/** Pill classes (ring style, matches the listings table badges). */
	badgeClass: string;
	/** Solid dot used in stat cards / legends. */
	dotClass: string;
};

export const BOOKING_STATUS_CONFIG: Record<BookingStatus, Tone> = {
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
		label: 'Completed',
		badgeClass: 'bg-muted text-muted-foreground ring-border',
		dotClass: 'bg-muted-foreground'
	},
	cancelled: {
		label: 'Cancelled',
		badgeClass: 'bg-destructive/10 text-destructive ring-destructive/20',
		dotClass: 'bg-destructive'
	}
};

export const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, Tone> = {
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

// === STATUS FILTER TAXONOMY ==================================================
// The host thinks in workflow stages, not raw enum values, so each filter maps
// 1:1 to a booking status (plus an "all" catch-all). The 1:1 mapping keeps the
// mental model predictable — what you filter by is exactly what the badge says.

export type BookingFilter =
	| 'all'
	| 'pending'
	| 'confirmed'
	| 'checked_in'
	| 'checked_out'
	| 'cancelled';

export const BOOKING_FILTERS: { value: BookingFilter; label: string }[] = [
	{ value: 'all', label: 'All' },
	{ value: 'pending', label: 'Requests' },
	{ value: 'confirmed', label: 'Upcoming' },
	{ value: 'checked_in', label: 'Hosting now' },
	{ value: 'checked_out', label: 'Completed' },
	{ value: 'cancelled', label: 'Cancelled' }
];

export function matchesFilter(b: BookingRecord, filter: BookingFilter): boolean {
	return filter === 'all' || b.status === filter;
}

/** Count of bookings per filter, for the badges on the segmented control. */
export function countByFilter(bookings: BookingRecord[]): Record<BookingFilter, number> {
	const counts: Record<BookingFilter, number> = {
		all: bookings.length,
		pending: 0,
		confirmed: 0,
		checked_in: 0,
		checked_out: 0,
		cancelled: 0
	};
	for (const b of bookings) counts[b.status] += 1;
	return counts;
}

/** Free-text match across the fields a host is likely to search by. */
export function matchesSearch(b: BookingRecord, query: string): boolean {
	const q = query.trim().toLowerCase();
	if (!q) return true;
	return [
		guestFullName(b),
		b.bookingCode,
		b.guestEmail,
		b.guestPhone,
		b.apartment.title,
		b.apartment.city
	].some((field) => field.toLowerCase().includes(q));
}

// === ACTION STATE MACHINE (dummy) ============================================
// Mirrors the transitions a real mutation would perform. Returns a fresh record
// so callers can swap it into reactive state without mutating the source.

export type BookingAction = 'confirm' | 'decline' | 'check_in' | 'check_out' | 'cancel';

type ActionMeta = { label: string; toast: string; variant: 'default' | 'destructive' | 'outline' };

/** Buttons offered in the detail sheet for a given status, in priority order. */
export function availableActions(status: BookingStatus): { action: BookingAction; meta: ActionMeta }[] {
	switch (status) {
		case 'pending':
			return [
				{ action: 'confirm', meta: { label: 'Confirm booking', toast: 'Booking confirmed', variant: 'default' } },
				{ action: 'decline', meta: { label: 'Decline', toast: 'Request declined', variant: 'destructive' } }
			];
		case 'confirmed':
			return [
				{ action: 'check_in', meta: { label: 'Check in guest', toast: 'Guest checked in', variant: 'default' } },
				{ action: 'cancel', meta: { label: 'Cancel booking', toast: 'Booking cancelled', variant: 'destructive' } }
			];
		case 'checked_in':
			return [
				{ action: 'check_out', meta: { label: 'Check out guest', toast: 'Stay completed', variant: 'default' } }
			];
		default:
			return [];
	}
}

export function actionToast(action: BookingAction): string {
	switch (action) {
		case 'confirm':
			return 'Booking confirmed';
		case 'decline':
			return 'Request declined';
		case 'check_in':
			return 'Guest checked in';
		case 'check_out':
			return 'Stay completed';
		case 'cancel':
			return 'Booking cancelled';
	}
}

/** Apply an action, returning a new booking record with updated status fields. */
export function applyBookingAction(b: BookingRecord, action: BookingAction): BookingRecord {
	const now = Date.now();
	switch (action) {
		case 'confirm':
			return { ...b, status: 'confirmed', updatedAt: now };
		case 'check_in':
			return { ...b, status: 'checked_in', updatedAt: now };
		case 'check_out':
			return { ...b, status: 'checked_out', updatedAt: now };
		case 'decline':
		case 'cancel':
			return {
				...b,
				status: 'cancelled',
				paymentStatus: b.paymentStatus === 'paid' ? 'refunded' : b.paymentStatus,
				cancelledBy: 'host',
				cancelledAt: now,
				cancelReason: action === 'decline' ? 'Request declined by host.' : 'Cancelled by host.',
				updatedAt: now
			};
	}
}
