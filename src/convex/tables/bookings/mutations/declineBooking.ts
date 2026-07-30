// UTILS
import { zAuthMutation } from '@/convex/auth/middleware/authMiddleware';
import { sendBookingDeclinedEmail } from '@/convex/email/sendBookingDeclinedEmail';
import { hostMayPerform } from '@/shared/features/booking/utils/hostMayPerform';
import { applyHostAction } from '@/shared/features/booking/utils/applyHostAction';
import { settleBookingPayment } from '@/convex/payments/helpers/settleBookingPayment';

// SCHEMAS
import { declineBookingSchema } from '@/shared/features/booking/schemas/bookingsSchemas';
import type { MutationResult } from '@/convex/schemas/schemas';

/** Host declines a pending booking request with a mandatory reason. */
export const declineBooking = zAuthMutation('declineBooking')({
	// The whole shared schema IS the args — no parallel v.* block, no safeParse in the handler.
	args: declineBookingSchema,
	// ponytail: no `returns` validator — the handler's `Promise<MutationResult>` types the
	// client; add a zod `zMutationResult` here only if you want runtime return validation.
	handler: async (ctx, args): Promise<MutationResult> => {
		const booking = await ctx.db.get(args.bookingId);
		if (!booking || booking.hostId !== ctx.userId) {
			return { success: false, message: { key: 'GenericMessages.FORBIDDEN' } };
		}
		if (!hostMayPerform('decline', booking)) {
			return { success: false, message: { key: 'GenericMessages.FORBIDDEN' } };
		}

		// Shared transition shape, with the host's own words replacing the generic reason —
		// the guest reads it (BookingSystemDesign.md §4).
		const patch = applyHostAction(booking, 'decline');
		if (!patch) {
			return { success: false, message: { key: 'GenericMessages.FORBIDDEN' } };
		}

		// Declining an `authorized` request releases the hold — no money ever moved (§4).
		const settlement = await settleBookingPayment(ctx, booking);

		await ctx.db.patch(args.bookingId, {
			...patch,
			...settlement,
			cancelReason: args.declineReason // already trimmed by declineBookingSchema
		});

		const apartment = booking.apartmentId ? await ctx.db.get(booking.apartmentId) : null;
		const apartmentTitle = apartment?.title ?? booking.apartmentSlug;

		await sendBookingDeclinedEmail(ctx, {
			locale: args.locale ?? 'en',
			bookingCode: booking.bookingCode,
			guestFirstName: booking.guestFirstName,
			guestEmail: booking.guestEmail,
			apartmentTitle,
			declineReason: args.declineReason,
			checkInDate: booking.checkInDate,
			checkOutDate: booking.checkOutDate
		});

		return { success: true, message: { key: 'GenericMessages.BOOKING_UPDATED' } };
	}
});
