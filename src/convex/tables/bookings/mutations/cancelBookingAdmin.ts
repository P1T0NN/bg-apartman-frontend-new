// CONFIG
import { PROJECT_SETTINGS } from '@/shared/config';

// UTILS
import { zAdminMutation } from '@/convex/auth/middleware/authMiddleware';
import { authComponent } from '@/convex/auth/auth';
import { analytics, ANALYTICS_EVENT, hostAnalyticsScope } from '@/convex/analytics';
import { sendBookingCancelledEmail } from '@/convex/email/sendBookingCancelledEmail';
import { AUDIT_ACTIONS } from '@/convex/tables/auditLog/auditLogConfigs';
import { isTerminalBookingStatus } from '@/shared/features/booking/utils/isTerminalBookingStatus';

// SCHEMAS
import { cancelBookingAdminSchema } from '@/shared/features/booking/schemas/cancelBookingAdminSchema';
import type { MutationResult } from '@/convex/schemas/schemas';

/**
 * Admin support action: cancel any non-terminal booking with a mandatory reason.
 * Recorded as `cancelledBy: 'system'`; both guest and host are emailed the reason.
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

		await ctx.db.patch(args.bookingId, {
			status: 'cancelled',
			updatedAt: Date.now(),
			cancelledAt: Date.now(),
			cancelledBy: 'system',
			cancelReason: args.cancelReason,
			pendingExpiresAt: undefined
		});

		// Only reverse GMV when the booking had actually earned it — an admin can also
		// cancel a still-pending request, which never emitted booking.confirmed.
		if (PROJECT_SETTINGS.BOOKING_EARNING_STATUSES.some((s) => s === booking.status)) {
			await analytics.track(ctx, ANALYTICS_EVENT.BOOKING_CANCELLED, {
				actorId: ctx.userId,
				scopes: [hostAnalyticsScope(booking.hostId)],
				properties: { totalEuros: booking.total, cancelledBy: 'system' }
			});
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

		const emailBase = {
			locale: args.locale ?? 'en',
			bookingCode: booking.bookingCode,
			apartmentTitle,
			checkInDate: booking.checkInDate,
			checkOutDate: booking.checkOutDate,
			cancelReason: args.cancelReason
		};

		await sendBookingCancelledEmail(ctx, {
			...emailBase,
			guestFirstName: booking.guestFirstName,
			guestEmail: booking.guestEmail
		});

		const hostEmail = host?.email?.trim();
		if (hostEmail) {
			await sendBookingCancelledEmail(ctx, {
				...emailBase,
				guestFirstName: host?.name?.trim() || 'Host',
				guestEmail: hostEmail
			});
		}

		return { success: true, message: { key: 'GenericMessages.BOOKING_UPDATED' } };
	}
});
