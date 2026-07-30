// LIBRARIES
import { v } from 'convex/values';
import { internalMutation } from '@/convex/functions';

// UTILS
import { authComponent } from '@/convex/auth/auth';

/**
 * Attach past anonymous bookings to a freshly signed-in account (GuestSystemDesign.md §1).
 *
 * Internal + fire-and-forget: scheduled from the auth flow's session trigger, never awaited
 * by it, so a claim can never slow down or fail a sign-in.
 *
 * - **Verified email is the proof of ownership.** An unverified account claims nothing —
 *   otherwise registering someone else's address would harvest their booking history. The
 *   email is read from the user row here, never passed in, so a caller can't spoof it.
 * - **Additive only, idempotent.** Rows that already have a `guestId` are left alone, so
 *   re-running is a no-op and a booking never moves between accounts.
 */
export const claimMyBookings = internalMutation({
	args: { userId: v.string() },
	returns: v.null(),
	handler: async (ctx, { userId }) => {
		const user = (await authComponent.getAnyUserById(ctx, userId)) as {
			email?: string;
			emailVerified?: boolean;
		} | null;

		const email = user?.email?.trim();
		if (!email || !user?.emailVerified) return null;

		const bookings = await ctx.db
			.query('bookings')
			.withIndex('by_guest_email', (q) => q.eq('guestEmail', email))
			.collect();

		for (const booking of bookings) {
			if (!booking.guestId) await ctx.db.patch(booking._id, { guestId: userId });
		}

		return null;
	}
});
