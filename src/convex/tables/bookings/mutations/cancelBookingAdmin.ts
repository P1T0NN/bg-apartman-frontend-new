// CONFIG
import { PROJECT_SETTINGS } from '@/shared/config';

// UTILS
import { zAdminMutation } from '@/convex/auth/middleware/authMiddleware';
import { authComponent } from '@/convex/auth/auth';
import { analytics, ANALYTICS_EVENT, hostAnalyticsScope } from '@/convex/analytics';
import { trackBookingNights } from '@/convex/tables/bookings/helpers/trackBookingNights';
import { sendBookingCancelledEmail } from '@/convex/email/sendBookingCancelledEmail';
import { sendBookingCancelledHostEmail } from '@/convex/email/sendBookingCancelledHostEmail';
import { AUDIT_ACTIONS } from '@/convex/tables/auditLog/auditLogConfigs';
import { isTerminalBookingStatus } from '@/shared/features/booking/utils/isTerminalBookingStatus';
import { settleBookingPayment } from '@/convex/payments/helpers/settleBookingPayment';
import { paymentNoteFrom } from '@/convex/payments/utils/paymentNoteFrom';

// SCHEMAS
import { cancelBookingAdminSchema } from '@/shared/features/booking/schemas/bookingsSchemas';
import type { MutationResult } from '@/convex/schemas/schemas';

/**
 * Admin support action: cancel any non-terminal booking with a mandatory reason.
 * Recorded as `cancelledBy: 'admin'` — distinct from `'system'` (the cron) so a support
 * intervention is never mistaken for an automatic expiry; both parties are emailed the reason.
 * Confirm/decline stay host-only and check-in/out stays cron-owned.
 */
export const cancelBookingAdmin = zAdminMutation('cancelBookingAdmin')({
	// The whole shared schema IS the args — no parallel v.* block (zAuthMutation pattern).
	args: cancelBookingAdminSchema,
	handler: async (ctx, args): Promise<MutationResult> => {
		const booking = await ctx.db.get(args.bookingId);
		if (!booking || isTerminalBookingStatus(booking.status)) {
			return { success: false, message: { key: 'GenericMessages.FORBIDDEN' } };
		}

		// The emergency brake refunds in full, whatever the window (§4). It stays possible on a
		// `checked_in` stay precisely because §5 transfers only on terminal bookings — the
		// money is still ours to give back. That invariant is what makes this row exist.
		const settlement = await settleBookingPayment(ctx, booking);

		await ctx.db.patch(args.bookingId, {
			status: 'cancelled',
			updatedAt: Date.now(),
			cancelledAt: Date.now(),
			cancelledBy: 'admin',
			cancelReason: args.cancelReason,
			pendingExpiresAt: undefined,
			...settlement
		});

		// Only reverse GMV and occupancy when the booking had actually earned them — an admin
		// can also cancel a still-pending request, which never emitted booking.confirmed and
		// whose nights were therefore never counted.
		if (PROJECT_SETTINGS.BOOKING_EARNING_STATUSES.some((s) => s === booking.status)) {
			await analytics.track(ctx, ANALYTICS_EVENT.BOOKING_CANCELLED, {
				actorId: ctx.userId,
				scopes: [hostAnalyticsScope(booking.hostId)],
				properties: { totalEuros: booking.total, cancelledBy: 'admin' }
			});
			await trackBookingNights(ctx, booking, 'released');
		}

		ctx.audit(AUDIT_ACTIONS.BOOKING_ADMIN_CANCEL, {
			resource: { table: 'bookings', id: args.bookingId },
			before: { status: booking.status },
			after: { status: 'cancelled' },
			metadata: { reason: args.cancelReason, bookingCode: booking.bookingCode }
		});

		const apartment = booking.apartmentId ? await ctx.db.get(booking.apartmentId) : null;
		const apartmentTitle = apartment?.title ?? booking.apartmentSlug;
		const host = await authComponent.getAnyUserById(ctx, booking.hostId);

		await sendBookingCancelledEmail(ctx, {
			locale: args.locale ?? 'en',
			bookingCode: booking.bookingCode,
			guestFirstName: booking.guestFirstName,
			guestEmail: booking.guestEmail,
			apartmentTitle,
			checkInDate: booking.checkInDate,
			checkOutDate: booking.checkOutDate,
			cancelReason: args.cancelReason,
			paymentNote: paymentNoteFrom(settlement, booking)
		});

		// The host gets the HOST-side email (support intervened + the reason), not a copy
		// of the guest's addressed to them.
		const hostEmail = host?.email?.trim();
		if (hostEmail) {
			await sendBookingCancelledHostEmail(ctx, {
				locale: 'en',
				bookingId: args.bookingId,
				bookingCode: booking.bookingCode,
				guestName: `${booking.guestFirstName} ${booking.guestLastName}`,
				hostName: host?.name?.trim() || 'Host',
				hostEmail,
				apartmentTitle,
				checkInDate: booking.checkInDate,
				checkOutDate: booking.checkOutDate,
				cancelReason: args.cancelReason,
				cancelledBy: 'admin'
			});
		}

		return { success: true, message: { key: 'GenericMessages.BOOKING_UPDATED' } };
	}
});
