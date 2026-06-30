// LIBRARIES
import { v } from 'convex/values';

// UTILS
import { authMutation } from '@/convex/auth/middleware/authMiddleware';
import { sendBookingCancelledEmail } from '@/convex/email/sendBookingCancelledEmail';
import { sendBookingConfirmedEmail } from '@/convex/email/sendBookingConfirmedEmail';
import { applyHostAction } from '@/shared/features/booking/utils/applyHostAction';
import { hostMayPerform } from '@/shared/features/booking/utils/hostMayPerform';

// SCHEMAS
import { bookingAction } from '@/convex/tables/bookings/schemas/bookingsSchemas';
import { mutationResult, type MutationResult } from '@/convex/schemas/schemas';

// TYPES
import type { typesBookingAction } from '@/shared/features/booking/types/bookingTypes';

const forbiddenResult = (): MutationResult => ({
	success: false,
	message: { key: 'GenericMessages.FORBIDDEN' }
});

/**
 * Host workflow on a booking they own: confirm / decline requests, check guests in/out,
 * cancel confirmed stays. Decline → `declined` (not `cancelled`). Cancel → `cancelled`.
 */
export const performBookingAction = authMutation('performBookingAction')({
	args: {
		bookingId: v.id('bookings'),
		action: bookingAction,
		locale: v.optional(v.string())
	},
	returns: mutationResult,
	handler: async (ctx, args): Promise<MutationResult> => {
		const booking = await ctx.db.get(args.bookingId);
		if (!booking || booking.hostId !== ctx.userId) return forbiddenResult();
		if (!hostMayPerform(args.action as typesBookingAction, booking)) return forbiddenResult();

		const patch = applyHostAction(booking, args.action as typesBookingAction);
		if (!patch) return forbiddenResult();

		await ctx.db.patch(args.bookingId, patch);

		const apartment = booking.apartmentId ? await ctx.db.get(booking.apartmentId) : null;
		const apartmentTitle = apartment?.title ?? booking.apartmentSlug;
		const locale = args.locale ?? 'en';

		if (args.action === 'confirm') {
			await sendBookingConfirmedEmail(ctx, {
				locale,
				bookingId: args.bookingId,
				bookingCode: booking.bookingCode,
				guestFirstName: booking.guestFirstName,
				guestEmail: booking.guestEmail,
				apartmentTitle,
				checkInDate: booking.checkInDate,
				checkOutDate: booking.checkOutDate,
				numberOfAdults: booking.numberOfAdults,
				numberOfChildren: booking.numberOfChildren,
				total: booking.total,
				currency: booking.currency
			});
		}

		if (args.action === 'cancel') {
			await sendBookingCancelledEmail(ctx, {
				locale,
				bookingCode: booking.bookingCode,
				guestFirstName: booking.guestFirstName,
				guestEmail: booking.guestEmail,
				apartmentTitle,
				checkInDate: booking.checkInDate,
				checkOutDate: booking.checkOutDate
			});
		}

		return { success: true, message: { key: 'GenericMessages.BOOKING_UPDATED' } };
	}
});
