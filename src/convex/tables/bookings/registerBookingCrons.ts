// LIBRARIES
import type { Crons } from 'convex/server';

// TYPES
import type { internal } from '../../_generated/api';

type InternalApi = typeof internal;

export function registerBookingCrons(crons: Crons, internalApi: InternalApi) {
	/**
	 * Advance bookings by date: confirmed → checked_in → checked_out, and expire stale
	 * pending requests into auto_declined (with a guest email). Hourly rather than daily so
	 * pending expiry stays responsive; check-in/out only change on day boundaries, so the
	 * extra passes are cheap no-ops.
	 */
	crons.hourly(
		'advance booking lifecycle',
		{ minuteUTC: 0 },
		internalApi.tables.bookings.crons.bookingLifecycleCron.advanceBookingLifecycle,
		{}
	);
}
