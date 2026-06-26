// LIBRARIES
import { v } from 'convex/values';

// SERVER
import { query } from '@/convex/_generated/server';

// TYPES
import type { Doc } from '@/convex/_generated/dataModel';

/**
 * Public single-booking fetch for `/reservation/[id]`.
 *
 * The booking id is the unguessable access key handed to the guest after checkout, so
 * anyone with the link can view the reservation (no account required). Returns `null`
 * for a missing id so the page renders a not-found state instead of throwing.
 */
export const getBookingById = query({
	args: { id: v.id('bookings') },
	handler: async (ctx, { id }): Promise<Doc<'bookings'> | null> => {
		return await ctx.db.get(id);
	}
});
