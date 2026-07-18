export const TERMINAL_BOOKING_STATUSES = new Set([
	'cancelled',
	'declined',
	'auto_declined',
	'checked_out'
] as const);

/** Statuses that still block the apartment calendar. */
export const ACTIVE_BOOKING_STATUSES = new Set<string>(['pending', 'confirmed', 'checked_in']);
