// LIBRARIES
import { v } from 'convex/values';

// SERVER
import { mutation } from '@/convex/_generated/server';

// SCHEMAS
import { paymentMethod } from '@/convex/tables/accommodations/schemas/accommodationsSchemas';
import { mutationResultData } from '@/convex/schemas/schemas';

const bookingData = v.object({
	bookingId: v.id('bookings'),
	bookingCode: v.string()
});

// Guest-readable alphabet — no 0/O/1/I so a code can be read off a screen or over the phone.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function makeBookingCode(): string {
	let code = 'BK';
	for (let i = 0; i < 8; i++) code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
	return code;
}

/** Whole nights between two ISO dates (check-out exclusive). */
function nightsBetween(checkIn: string, checkOut: string): number {
	const start = new Date(checkIn).getTime();
	const end = new Date(checkOut).getTime();
	if (Number.isNaN(start) || Number.isNaN(end)) return 0;
	return Math.max(0, Math.round((end - start) / 86_400_000));
}

/**
 * Create a guest booking and return its id + human-readable code.
 *
 * Public (no auth): guests book without an account. The returned `bookingId` is the
 * unguessable access key for `/reservation/[id]`; `bookingCode` is the short code shown
 * to the guest and used for support lookups. Status is `confirmed` for instant-book
 * listings, otherwise `pending` (host review). Payment is `pending` — cash is settled
 * on arrival.
 */
export const createBooking = mutation({
	args: {
		apartmentSlug: v.string(),
		hostId: v.string(),

		guestFirstName: v.string(),
		guestLastName: v.string(),
		guestEmail: v.string(),
		guestPhone: v.string(),
		specialRequests: v.optional(v.string()),

		checkInDate: v.string(),
		checkOutDate: v.string(),
		numberOfAdults: v.number(),
		numberOfChildren: v.number(),

		subtotal: v.number(),
		cleaningFee: v.number(),

		paymentMethod,
		instantBooking: v.boolean()
	},
	returns: mutationResultData(bookingData),
	handler: async (ctx, args) => {
		const numberOfNights = nightsBetween(args.checkInDate, args.checkOutDate);
		if (numberOfNights < 1) {
			return {
				success: false,
				message: { key: 'GenericMessages.INVALID_BOOKING_DATES' }
			};
		}

		const apartment = await ctx.db
			.query('apartments')
			.withIndex('by_slug', (q) => q.eq('slug', args.apartmentSlug))
			.first();

		if (!apartment || apartment.status !== 'published' || apartment.hostId !== args.hostId) {
			return {
				success: false,
				message: { key: 'GenericMessages.INVALID_BOOKING_DATES' }
			};
		}

		const bookingCode = makeBookingCode();

		const bookingId = await ctx.db.insert('bookings', {
			bookingCode,
			apartmentId: apartment._id,
			apartmentSlug: args.apartmentSlug,
			hostId: args.hostId,

			guestFirstName: args.guestFirstName.trim(),
			guestLastName: args.guestLastName.trim(),
			guestEmail: args.guestEmail.trim(),
			guestPhone: args.guestPhone.trim(),
			specialRequests: args.specialRequests?.trim() || undefined,

			checkInDate: args.checkInDate,
			checkOutDate: args.checkOutDate,
			numberOfAdults: args.numberOfAdults,
			numberOfChildren: args.numberOfChildren,
			numberOfNights,

			subtotal: args.subtotal,
			cleaningFee: args.cleaningFee,
			total: args.subtotal + args.cleaningFee,
			currency: 'EUR',

			paymentMethod: args.paymentMethod,
			paymentStatus: 'pending',
			status: args.instantBooking ? 'confirmed' : 'pending',

			updatedAt: Date.now()
		});

		return {
			success: true,
			message: { key: 'GenericMessages.BOOKING_CREATED' },
			data: { bookingId, bookingCode }
		};
	}
});
