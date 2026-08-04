// LIBRARIES
import { v } from 'convex/values';
import { query } from '@/convex/_generated/server';

// HELPERS
import { getAuthUserId } from '@/convex/auth/helpers/getAuthUserId';

// CONFIG
import { PROJECT_SETTINGS } from '@/shared/config';

// UTILS
import { BLOCKING_BOOKING_STATUSES } from '@/shared/features/booking/data/bookingsData';
import { todayInPropertyZone } from '@/shared/features/booking/utils/daysUntilCheckIn';
import { shiftIsoDate } from '@/shared/utils/dateUtils';

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

		// Windowed from a year back, forward without limit. Unbounded, these two reads pulled
		// the listing's ENTIRE history on every re-run of a subscription that re-runs on every
		// booking and block write — and blocks are one row per night, so a host who closes a
		// month a year accumulates dead rows forever. A year of history covers every stay
		// still in progress (MAX_STAY_NIGHTS) plus recent context; the forward side is open
		// because a calendar's whole job is what's ahead.
		const historyFloor = shiftIsoDate(todayInPropertyZone(), -PROJECT_SETTINGS.MAX_STAY_NIGHTS);

		const [bookings, blocks] = await Promise.all([
			ctx.db
				.query('bookings')
				.withIndex('by_apartment_dates', (q) =>
					q.eq('apartmentId', args.apartmentId).gte('checkInDate', historyFloor)
				)
				.collect(),
			ctx.db
				.query('apartmentBlocks')
				.withIndex('by_apartment', (q) =>
					q.eq('apartmentId', args.apartmentId).gte('startDate', historyFloor)
				)
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
