// LIBRARIES
import { ConvexError } from 'convex/values';

// HELPERS
import { fetchOptimized } from '@/convex/helpers/fetchOptimized';
import { getAuthUserId } from '@/convex/auth/helpers/getAuthUserId';

// UTILS
import { bookingToBookingSafe } from '@/convex/tables/bookings/utils/bookingToBookingSafe';

// TYPES
import type { ConvexErrorPayload } from '@/shared/types/types';

/**
 * Guest-scoped booking list for the "My bookings" page — all statuses, enriched with apartment
 * summaries. Indexed via `by_guest`; offset pagination so the client can pull the full set in
 * one request for stats + client-side filter/sort/table UX.
 */
export const fetchMyBookingsSafe = fetchOptimized({
	table: 'bookings',
	auth: 'user',
	strategy: 'offset',
	order: 'desc',
	where: async (ctx) => {
		const guestId = await getAuthUserId(ctx);
		if (!guestId) {
			throw new ConvexError({
				code: 'NOT_AUTHENTICATED',
				message: { key: 'GenericMessages.NOT_AUTHENTICATED' }
			} satisfies ConvexErrorPayload);
		}

		return {
			index: 'by_guest',
			eq: { guestId }
		};
	},
	enrich: (ctx, page) => Promise.all(page.map((booking) => bookingToBookingSafe(ctx, booking)))
});
