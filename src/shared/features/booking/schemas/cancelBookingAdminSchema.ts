// LIBRARIES
import { z } from 'zod';
import { zid } from 'convex-helpers/server/zod4';

/**
 * Full argument schema for the `cancelBookingAdmin` mutation — the single source of
 * truth (zAuthMutation pattern, see declineBookingSchema). The admin cancel dialog
 * reuses it via `.pick({ cancelReason: true })`.
 */
export const cancelBookingAdminSchema = z.object({
	bookingId: zid('bookings'),
	cancelReason: z
		.string()
		.trim()
		.min(4, 'ValidationMessages.cancelBookingAdminSchema.reasonMin')
		.max(500, 'ValidationMessages.cancelBookingAdminSchema.reasonMax'),
	locale: z.string().optional()
});
