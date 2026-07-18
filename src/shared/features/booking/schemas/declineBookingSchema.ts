// LIBRARIES
import { z } from 'zod';
import { zid } from 'convex-helpers/server/zod4';

/**
 * Full argument schema for the `declineBooking` mutation — the single source of truth.
 *
 * Passed whole to `zAuthMutation` as its `args`, so the Convex boundary validates against
 * exactly this. The decline AlertDialog reuses it via `declineBookingSchema.shape.declineReason`
 * (or `.pick({ declineReason: true })`) — no field schema is duplicated anywhere.
 *
 * `declineReason` output is already trimmed; the "≥ 4 characters" rule lives only here.
 */
export const declineBookingSchema = z.object({
	bookingId: zid('bookings'),
	declineReason: z
		.string()
		.trim()
		.min(4, 'ValidationMessages.declineBookingSchema.reasonMin')
		.max(500, 'ValidationMessages.declineBookingSchema.reasonMax'),
	locale: z.string().optional()
});
