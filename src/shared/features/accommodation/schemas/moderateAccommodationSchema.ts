// LIBRARIES
import { z } from 'zod';
import { zid } from 'convex-helpers/server/zod4';

/**
 * Full argument schema for the `moderateApartmentStatus` mutation — the single source
 * of truth (zAuthMutation pattern, see declineBookingSchema).
 *
 * `reason` is optional here so approve/archive need no reason; the "suspend requires a
 * reason" rule lives in the mutation handler (and the suspend dialog validates it with
 * {@link moderationReasonSchema} before submitting).
 */
export const moderationReasonSchema = z
	.string()
	.trim()
	.min(4, 'ValidationMessages.moderationReasonSchema.reasonMin')
	.max(500, 'ValidationMessages.moderationReasonSchema.reasonMax');

export const moderateAccommodationSchema = z.object({
	id: zid('apartments'),
	status: z.enum(['published', 'suspended', 'archived']),
	reason: moderationReasonSchema.optional(),
	locale: z.string().optional()
});
