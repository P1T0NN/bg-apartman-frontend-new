// LIBRARIES
import { v } from 'convex/values';
import { query } from '@/convex/_generated/server';

// HELPERS
import { getAuthUserId } from '@/convex/auth/helpers/getAuthUserId';

// UTILS
import { BLOCKING_BOOKING_STATUSES } from '@/shared/features/booking/data/bookingsData';

// TYPES
import type { typesApartmentCalendar } from '@/shared/features/booking/types/bookingTypes';

const calendarRange = v.object({
	start: v.string(),
	end: v.string(),
	status: v.union(v.literal('booked'), v.literal('blocked')),
	/** `booked` ranges only — lets the host click a sold night straight through to its
	 *  reservation (HostSystemDesign.md §4). Safe here because this query is host-scoped;
	 *  the guest-facing availability read must never include it. */
	// Plain string, not `v.id`: the shared calendar type stays framework-free (no Convex
	// imports in `src/shared`), and the consumer only ever puts it in a URL.
	bookingId: v.optional(v.string())
});

/**
 * One listing's calendar for its host: nights sold + nights the host closed.
 *
 * Same definition of "occupied" the booking mutations enforce — blocking statuses only, so
 * a `pending` request never paints the calendar. Requests block nothing until confirmed, and
 * showing them as booked would teach the host the wrong model
 * (BookingSystemDesign.md §6, HostSystemDesign.md §4).
 *
 * Realtime: subscribed. Bookings land from other people while the host edits blocks, and
 * this same screen mutates what it displays — the rule's "changes under the viewer" case.
 *
 * Returns `[]` rather than throwing for a listing the caller doesn't own, so the tab renders
 * an empty calendar instead of an error boundary.
 */
export const fetchApartmentCalendarSafe = query({
	args: { apartmentId: v.id('apartments') },
	returns: v.array(calendarRange),
	handler: async (ctx, args): Promise<typesApartmentCalendar> => {
		const userId = await getAuthUserId(ctx);
		if (!userId) return [];

		const apartment = await ctx.db.get(args.apartmentId);
		if (!apartment || apartment.hostId !== userId) return [];

		const [bookings, blocks] = await Promise.all([
			ctx.db
				.query('bookings')
				.withIndex('by_apartment', (q) => q.eq('apartmentId', args.apartmentId))
				.collect(),
			ctx.db
				.query('apartmentBlocks')
				.withIndex('by_apartment', (q) => q.eq('apartmentId', args.apartmentId))
				.collect()
		]);

		return [
			...bookings
				.filter((booking) => BLOCKING_BOOKING_STATUSES.has(booking.status))
				.map((booking) => ({
					start: booking.checkInDate,
					end: booking.checkOutDate,
					status: 'booked' as const,
					bookingId: booking._id
				})),
			...blocks.map((block) => ({
				start: block.startDate,
				end: block.endDate,
				status: 'blocked' as const
			}))
		];
	}
});
