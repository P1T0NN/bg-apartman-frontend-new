// TYPES
import type { Doc } from '@/convex/_generated/dataModel';

/**
 * Free-text match over the booking fields a host/guest is likely to search by.
 * `needle` is expected pre-trimmed and lowercased by the caller.
 */
export function matchesBookingSearch(booking: Doc<'bookings'>, needle: string): boolean {
	return [
		`${booking.guestFirstName} ${booking.guestLastName}`,
		booking.bookingCode,
		booking.guestEmail,
		booking.guestPhone ?? '',
		booking.apartmentSlug
	].some((field) => field.toLowerCase().includes(needle));
}
