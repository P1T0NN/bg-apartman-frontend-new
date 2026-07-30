// TYPES
import type { Doc, Id } from '@/convex/_generated/dataModel';
import type { QueryCtx } from '@/convex/_generated/server';

/**
 * An existing open request from the same guest for the same listing and dates
 * (GuestSystemDesign.md §2/§9).
 *
 * Double-submits happen — a double-click, a back-button, an impatient refresh. Creating a
 * second `pending` row would put two identical requests in the host's queue and two
 * reservation links in the guest's inbox, so the create path returns the FIRST one instead.
 *
 * Email match is case-insensitive: the same person typing `Ana@x.com` twice is the same
 * person. Only `pending` counts — once a request is answered, asking again is a real new
 * booking, not a duplicate.
 *
 * `awaiting` rows don't count either: that guest has an OPEN checkout, not a request.
 * Handing them back a reservation link for a booking nobody has been told about would
 * strand them on a "finalising…" page with no way to pay (PaymentsSystemDesign.md §3) —
 * they get a fresh row, and the abandoned one is reaped at its deadline.
 */
export async function findOpenDuplicateRequest(
	ctx: QueryCtx,
	apartmentId: Id<'apartments'>,
	guestEmail: string,
	checkInDate: string,
	checkOutDate: string
): Promise<Doc<'bookings'> | null> {
	const needle = guestEmail.trim().toLowerCase();

	const sameStay = await ctx.db
		.query('bookings')
		.withIndex('by_apartment_dates', (q) =>
			q
				.eq('apartmentId', apartmentId)
				.eq('checkInDate', checkInDate)
				.eq('checkOutDate', checkOutDate)
		)
		.collect();

	return (
		sameStay.find(
			(booking) =>
				booking.status === 'pending' &&
				booking.paymentStatus !== 'awaiting' &&
				booking.guestEmail.trim().toLowerCase() === needle
		) ?? null
	);
}
