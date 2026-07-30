// LIBRARIES
import { v } from 'convex/values';

// UTILS
import { adminMutation } from '@/convex/auth/middleware/authMiddleware';
import { AUDIT_ACTIONS } from '@/convex/tables/auditLog/auditLogConfigs';

// SCHEMAS
import { mutationResult, type MutationResult } from '@/convex/schemas/schemas';

/**
 * Admin clears a booking's payment flag after finishing the failed money operation by
 * hand — the closing move of the "state unchanged + admin flag + reconciliation
 * re-surface" pattern (PaymentsSystemDesign.md §4/§6, AdminPagesSystemDesign.md §3).
 *
 * Clearing is a statement of fact ("I completed this in the provider dashboard"), not an
 * action on money: nothing is charged, refunded or transferred here. It also clears the
 * booking's earning-row `payoutFlag` when present, which is what lets the payout sweep
 * resume on that row (§5's "retried by the next sweep only after the flag is cleared").
 *
 * Audit-logged: which flag was cleared and by whom IS the trail that the failure was
 * handled by a human rather than silently dropped.
 */
export const clearPaymentFlag = adminMutation('clearPaymentFlag')({
	args: { bookingId: v.id('bookings') },
	returns: mutationResult,
	handler: async (ctx, args): Promise<MutationResult> => {
		const booking = await ctx.db.get(args.bookingId);
		if (!booking) return { success: false, message: { key: 'GenericMessages.FORBIDDEN' } };

		const earning = await ctx.db
			.query('bookingEarnings')
			.withIndex('by_booking', (q) => q.eq('bookingId', args.bookingId))
			.first();

		if (booking.paymentFlag === undefined && !earning?.payoutFlag) {
			// Already clean — friendly no-op (double-click, or a webhook beat the admin to it).
			return { success: true, message: { key: 'GenericMessages.PAYMENT_FLAG_CLEARED' } };
		}

		if (booking.paymentFlag !== undefined) {
			await ctx.db.patch(args.bookingId, { paymentFlag: undefined, updatedAt: Date.now() });
		}
		if (earning?.payoutFlag) {
			await ctx.db.patch(earning._id, { payoutFlag: undefined });
		}

		ctx.audit(AUDIT_ACTIONS.BOOKING_PAYMENT_FLAG_CLEAR, {
			resource: { table: 'bookings', id: args.bookingId },
			before: {
				paymentFlag: booking.paymentFlag ?? null,
				payoutFlag: earning?.payoutFlag ?? null
			},
			after: { paymentFlag: null, payoutFlag: null },
			metadata: { bookingCode: booking.bookingCode }
		});

		return { success: true, message: { key: 'GenericMessages.PAYMENT_FLAG_CLEARED' } };
	}
});
