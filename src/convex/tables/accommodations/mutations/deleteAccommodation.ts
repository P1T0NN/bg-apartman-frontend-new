// LIBRARIES
import { ConvexError } from 'convex/values';

// HELPERS
import { createDeleteMutation } from '@/convex/helpers/createDeleteMutation';
import { deleteApartmentImageKeys } from '../helpers/deleteApartmentImages';
import { getAuthUserId } from '@/convex/auth/helpers/getAuthUserId';
import { authComponent } from '@/convex/auth/auth';

// DATA
import { ACTIVE_BOOKING_STATUSES } from '@/shared/features/booking/data/bookingsData';

/**
 * Admin-OR-owner delete for an apartment accommodation (the factory's documented OR
 * pattern: full rule in `authorize`, default admin gate disabled). Owners self-delete
 * via `hostId`; admins delete anyone's (the moderation "decline" flow). Phase 1
 * removes the accommodation's R2 photos + their `uploadedFilesR2` rows before the row
 * itself is deleted.
 *
 * Integrity guard: deletion is blocked while any booking in an {@link ACTIVE_BOOKING_STATUSES}
 * state (pending / confirmed / checked_in) references the apartment — those are live guest
 * commitments and must be cancelled or declined first. Terminal bookings (checked_out,
 * cancelled, declined, auto_declined) are historical records that survive fine: they carry a
 * denormalized `apartmentSlug` and every reader null-checks the apartment, so a deleted row
 * degrades to a "Stay" label rather than breaking. The guard lives in `authorize` because that
 * runs BEFORE Phase 1, so a blocked delete never issues (and rolls back) any R2 calls.
 */
export const deleteApartment = createDeleteMutation('deleteApartment', {
	table: 'apartments',
	adminOnly: false,
	authorize: async (ctx, doc) => {
		// 1. Auth — owner or admin.
		const userId = await getAuthUserId(ctx);
		if (!userId) return false;
		if (doc.hostId !== userId) {
			const user = await authComponent.getAuthUser(ctx);
			if ((user as { role?: string } | null)?.role !== 'admin') return false;
		}

		// 2. Referential integrity — block if any active booking points at this apartment.
		//    Thrown (not `return false`) so the client gets the specific "has active bookings"
		//    message instead of a generic FORBIDDEN. `safeMutation` toasts it and aborts.
		const bookings = await ctx.db
			.query('bookings')
			.withIndex('by_apartment', (q) => q.eq('apartmentId', doc._id))
			.collect();
		if (bookings.some((booking) => ACTIVE_BOOKING_STATUSES.has(booking.status))) {
			throw new ConvexError({
				code: 'ACCOMMODATION_HAS_ACTIVE_BOOKINGS',
				message: { key: 'GenericMessages.ACCOMMODATION_HAS_ACTIVE_BOOKINGS' }
			});
		}

		return true;
	},
	runStorageDelete: (ctx, docs) =>
		deleteApartmentImageKeys(
			ctx,
			docs.flatMap((doc) => doc.images.map((image) => image.key))
		)
});
