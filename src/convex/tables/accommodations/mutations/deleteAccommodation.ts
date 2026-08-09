// LIBRARIES
import { ConvexError } from 'convex/values';

// HELPERS
import { createDeleteMutation } from '@/convex/helpers/createDeleteMutation';
import { deleteApartmentImageKeys } from '../helpers/deleteApartmentImages';
import { getAuthUserId } from '@/convex/auth/helpers/getAuthUserId';
import { authComponent } from '@/convex/auth/auth';

// CONFIG
import { PROJECT_SETTINGS } from '@/shared/config';

// DATA
import { ACTIVE_BOOKING_STATUSES } from '@/shared/features/booking/data/bookingsData';

// UTILS
import { todayInPropertyZone } from '@/shared/features/booking/utils/daysUntilCheckIn';
import { shiftIsoDate } from '@/shared/utils/dateUtils';

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
			// Only stays that could still be active: a booking whose check-in is older than
			// the longest possible stay has necessarily ended. Unbounded, this read the
			// listing's entire history to answer one boolean.
			.withIndex('by_apartment_dates', (q) =>
				q
					.eq('apartmentId', doc._id)
					.gte(
						'checkInDate',
						shiftIsoDate(todayInPropertyZone(), -PROJECT_SETTINGS.MAX_STAY_NIGHTS)
					)
			)
			.collect();
		if (bookings.some((booking) => ACTIVE_BOOKING_STATUSES.has(booking.status))) {
			throw new ConvexError({
				code: 'ACCOMMODATION_HAS_ACTIVE_BOOKINGS',
				message: { key: 'GenericMessages.ACCOMMODATION_HAS_ACTIVE_BOOKINGS' }
			});
		}

		return true;
	},
	// Cascade: saved-listing rows pointing at this listing. Same transaction as the delete, so
	// there is no window where a favorite references a row that is gone — and no dangling row
	// eating a slot in some guest's capped set forever.
	onDelete: async (ctx, doc) => {
		const favorites = await ctx.db
			.query('favorites')
			.withIndex('by_apartment', (q) => q.eq('apartmentId', doc._id))
			.collect();
		for (const favorite of favorites) await ctx.db.delete(favorite._id);
	},
	runStorageDelete: (ctx, docs) =>
		deleteApartmentImageKeys(
			ctx,
			docs.flatMap((doc) => doc.images.map((image) => image.key))
		)
});
