// LIBRARIES
import { v } from 'convex/values';
import { query } from '@/convex/_generated/server';

// HELPERS
import { getAuthUserId } from '@/convex/auth/helpers/getAuthUserId';

// UTILS
import { bookingToBookingSafe } from '@/convex/tables/bookings/utils/bookingToBookingSafe';

// TYPES
import type { typesBookingSafe } from '@/shared/features/booking/types/bookingTypes';

/**
 * One of the host's own bookings by id — what `/host/reservations?booking=<id>` opens.
 *
 * The queue's list query is filtered and paginated, so a deep-linked booking is usually NOT
 * on the current page (the default tab is Pending; a calendar link points at a confirmed
 * stay). This fetches it directly instead of hunting for it in the list.
 *
 * Returns `null` for a missing booking or one the caller doesn't host — no ownership oracle,
 * and the page just doesn't open a sheet.
 */
export const fetchHostBookingSafe = query({
	args: { bookingId: v.id('bookings') },
	handler: async (ctx, { bookingId }): Promise<typesBookingSafe | null> => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return null;

		const booking = await ctx.db.get(bookingId);
		if (!booking || booking.hostId !== userId) return null;

		return await bookingToBookingSafe(ctx, booking);
	}
});
