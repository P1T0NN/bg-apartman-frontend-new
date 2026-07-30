/**
 * Nothing transitions out of these — including admins (BookingSystemDesign.md §2). A
 * wrong terminal state is fixed by support communication, never by resurrecting the row.
 */
export const TERMINAL_BOOKING_STATUSES = new Set([
	'cancelled',
	'declined',
	'auto_declined',
	'withdrawn',
	'checked_out'
] as const);

/**
 * Statuses that are still in play — the booking can still become a stay, so the listing
 * can't be deleted out from under it. NOT the same as blocking the calendar.
 */
export const ACTIVE_BOOKING_STATUSES = new Set<string>(['pending', 'confirmed', 'checked_in']);

/**
 * Statuses that actually occupy nights (BookingSystemDesign.md §6).
 *
 * `pending` is deliberately absent: a request is a question, not a reservation. Several
 * guests may hold overlapping requests on the same dates; the first confirm wins and the
 * rest are auto-declined in that same mutation. Blocking on `pending` would let one
 * unanswered request freeze a calendar for 48h.
 */
export const BLOCKING_BOOKING_STATUSES = new Set<string>(['confirmed', 'checked_in']);

/**
 * Statuses folded into the "cancelled" tab — mirrors the client filter taxonomy, so a
 * closed booking is always reachable under exactly one tab.
 */
export const CLOSED_BOOKING_STATUSES = new Set<string>([
	'cancelled',
	'declined',
	'auto_declined',
	'withdrawn'
]);
