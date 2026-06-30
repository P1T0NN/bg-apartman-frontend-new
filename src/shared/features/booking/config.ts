const MS_PER_HOUR = 60 * 60 * 1000;
export const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Shared booking rules — imported by Convex mutations and the Svelte UI. */
export const BOOKING_POLICY = {
	/** Host must confirm or decline a request within this window. */
	HOST_RESPONSE_HOURS: 48,
	/** Guest may self-cancel a confirmed stay when check-in is at least this many days away. */
	GUEST_FREE_CANCEL_DAYS_BEFORE_CHECKIN: 7
} as const;

export const HOST_RESPONSE_MS = BOOKING_POLICY.HOST_RESPONSE_HOURS * MS_PER_HOUR;
