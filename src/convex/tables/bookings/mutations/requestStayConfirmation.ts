// LIBRARIES
import { v } from 'convex/values';

// CONFIG
import { STAY_CONFIRMATION_COOLDOWN_MS } from '@/shared/config';

// UTILS
import { authMutation } from '@/convex/auth/middleware/authMiddleware';
import { authComponent } from '@/convex/auth/auth';
import { sendStayConfirmationRequestEmail } from '@/convex/email/sendStayConfirmationRequestEmail';

// SCHEMAS
import { mutationResult, type MutationResult } from '@/convex/schemas/schemas';

/**
 * Host asks the guest to confirm their stay is still on — the provable version of the §4
 * verification norm (BookingSystemDesign.md §11).
 *
 * Stamps `stayConfirmationRequestedAt` (re-requests overwrite: the question is re-asked)
 * and emails the guest their reservation link, where the live page shows the one-click
 * confirm banner. If the request sits unanswered for the unlock window, the host's
 * cash-inside-window cancel opens (`hostMayCancelConfirmed`).
 *
 * Allowed on any confirmed booking — verifying a stay is normal host behaviour, not just
 * a cash-window mechanic. The cooldown is the anti-nag valve.
 */
export const requestStayConfirmation = authMutation('requestStayConfirmation')({
	args: {
		bookingId: v.id('bookings'),
		locale: v.optional(v.string())
	},
	returns: mutationResult,
	handler: async (ctx, args): Promise<MutationResult> => {
		const booking = await ctx.db.get(args.bookingId);
		if (!booking || booking.hostId !== ctx.userId || booking.status !== 'confirmed') {
			return { success: false, message: { key: 'GenericMessages.FORBIDDEN' } };
		}

		const now = Date.now();
		if (
			booking.stayConfirmationRequestedAt !== undefined &&
			now - booking.stayConfirmationRequestedAt < STAY_CONFIRMATION_COOLDOWN_MS
		) {
			return { success: false, message: { key: 'GenericMessages.STAY_CONFIRMATION_COOLDOWN' } };
		}

		await ctx.db.patch(args.bookingId, { stayConfirmationRequestedAt: now, updatedAt: now });

		const apartment = await ctx.db.get(booking.apartmentId);
		const host = await authComponent.getAnyUserById(ctx, booking.hostId);

		await sendStayConfirmationRequestEmail(ctx, {
			locale: args.locale ?? 'en',
			bookingId: args.bookingId,
			bookingCode: booking.bookingCode,
			guestFirstName: booking.guestFirstName,
			guestEmail: booking.guestEmail,
			apartmentTitle: apartment?.title ?? booking.apartmentSlug,
			checkInDate: booking.checkInDate,
			checkOutDate: booking.checkOutDate,
			hostName: host?.name?.trim() || undefined
		});

		return { success: true, message: { key: 'GenericMessages.STAY_CONFIRMATION_REQUESTED' } };
	}
});
