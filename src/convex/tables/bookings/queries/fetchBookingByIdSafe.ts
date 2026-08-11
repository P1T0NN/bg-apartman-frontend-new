// LIBRARIES
import { v } from 'convex/values';
import { query } from '@/convex/_generated/server';

// HELPERS
import { getAuthUserId } from '@/convex/auth/helpers/getAuthUserId';
import { bookingToBookingSafe } from '@/convex/tables/bookings/utils/bookingToBookingSafe';

// TYPES
import type { typesBookingSafe } from '@/shared/features/booking/types/bookingTypes';

/**
 * One booking by id for either party on it — host or guest — what the detail sheet renders.
 *
 * The sheet opens on the id alone and owns this ONE by-id subscription (live only while
 * open, `skip` otherwise); the table's list query keeps powering the rows. Live means the
 * sheet re-renders the moment any mutation touches the booking — the stay-confirmation
 * panel flips to "Asked…" as soon as the request lands, no snapshot to go stale.
 *
 * Not the public reservation page's `fetchBookingById` — that one treats the id as an
 * unguessable access key and needs no account. This is the signed-in twin.
 *
 * Returns `null` for a missing booking or one the caller isn't host or guest on — no
 * ownership oracle, the sheet just doesn't open.
 */
export const fetchBookingByIdSafe = query({
	args: { bookingId: v.id('bookings') },
	handler: async (ctx, { bookingId }): Promise<typesBookingSafe | null> => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return null;

		const booking = await ctx.db.get(bookingId);
		if (!booking || (booking.hostId !== userId && booking.guestId !== userId)) return null;

		return await bookingToBookingSafe(ctx, booking);
	}
});
