/** Query tuning for the guest dashboard (`/guest/dashboard`). */
export const GUEST_DASHBOARD = {
	/** Hero + "more upcoming" rows — never return the whole upcoming list. */
	UPCOMING_LIMIT: 4,

	/**
	 * Past-stays count is a soft stat: `.take(CAP + 1)` bounds the read, and the tile shows
	 * "99+" past it. No counter table until a check-out mutation maintains one.
	 */
	CHECKED_OUT_COUNT_CAP: 99
} as const;
