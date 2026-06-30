// LIBRARIES
import { v } from 'convex/values';
import { mutation } from '@/convex/_generated/server';

// UTILS
import { authComponent } from '@/convex/auth/auth';
import { sendCreateBookingEmail } from '@/convex/email/sendCreateBookingEmail';
import { calculatePrice } from '@/shared/features/pricing/utils/calculatePrice';
import { makeBookingCode } from '@/shared/features/booking/utils/makeBookingCode';
import { nightsBetween } from '@/shared/utils/dateUtils';

// SCHEMAS
import { paymentMethod } from '@/convex/tables/accommodations/schemas/accommodationsSchemas';
import { pendingExpiresAtFrom } from '@/shared/features/booking/utils/pendingExpiresAtFrom';
import { mutationResultData } from '@/convex/schemas/schemas';

const bookingData = v.object({
	bookingId: v.id('bookings'),
	bookingCode: v.string()
});

/**
 * Create a guest booking and return its id + human-readable code.
 *
 * Public (no auth): guests book without an account. The returned `bookingId` is the
 * unguessable access key for `/reservations/[id]`; `bookingCode` is the short code shown
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

		paymentMethod,
		instantBooking: v.boolean(),
		locale: v.optional(v.string())
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

		// Price is derived from the listing server-side — never trusted from the client. The
		// apartment doc carries the `pricePerNight` / `discountAmount` / `cleaningFee` shape
		// `calculatePrice` expects.
		const quote = calculatePrice(apartment, numberOfNights);

		const bookingCode = makeBookingCode();
		const now = Date.now();
		const isInstant = args.instantBooking;

		const hostUser = (await authComponent.getAnyUserById(ctx, args.hostId)) as {
			name?: string;
			email?: string;
		} | null;

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

			subtotal: quote.accommodationTotal,
			cleaningFee: quote.cleaningFee,
			total: quote.total,
			currency: 'EUR',

			paymentMethod: args.paymentMethod,
			paymentStatus: 'pending',
			status: isInstant ? 'confirmed' : 'pending',
			pendingExpiresAt: isInstant ? undefined : pendingExpiresAtFrom(now),

			updatedAt: now
		});

		const hostEmail = hostUser?.email?.trim();

		await sendCreateBookingEmail(ctx, {
			locale: args.locale ?? 'en',
			bookingId,
			bookingCode,
			apartmentTitle: apartment.title,
			checkInDate: args.checkInDate,
			checkOutDate: args.checkOutDate,
			numberOfAdults: args.numberOfAdults,
			numberOfChildren: args.numberOfChildren,
			total: quote.total,
			currency: 'EUR',
			instantBooking: args.instantBooking,
			guestFirstName: args.guestFirstName.trim(),
			guestLastName: args.guestLastName.trim(),
			guestEmail: args.guestEmail.trim(),
			guestPhone: args.guestPhone.trim(),
			hostName: hostUser?.name?.trim() || 'Host',
			hostEmail: hostEmail ?? ''
		});

		return {
			success: true,
			message: { key: 'GenericMessages.BOOKING_CREATED' },
			data: { bookingId, bookingCode }
		};
	}
});
