// LIBRARIES
import { v } from 'convex/values';

// SERVER
import { query } from '@/convex/_generated/server';

// UTILS
import { authComponent } from '@/convex/auth/auth';
import { BLOCKING_BOOKING_STATUSES } from '@/shared/features/booking/data/bookingsData';

// TYPES
import type { Doc, Id } from '@/convex/_generated/dataModel';
import type { typesAccommodationEnriched } from '@/shared/features/accommodation/types/accommodationTypes';
import type { QueryCtx } from '@/convex/_generated/server';

/**
 * Nights the guest cannot pick: blocking bookings + the host's own calendar blocks — the
 * same definition of "free" the create/confirm mutations enforce. `pending` requests are
 * excluded on purpose, so a guest can still request dates someone else has merely asked
 * for (BookingSystemDesign.md §6).
 */
async function fetchBookedRanges(ctx: QueryCtx, apartmentId: Id<'apartments'>) {
	const [bookings, blocks] = await Promise.all([
		ctx.db
			.query('bookings')
			.withIndex('by_apartment', (q) => q.eq('apartmentId', apartmentId))
			.collect(),
		ctx.db
			.query('apartmentBlocks')
			.withIndex('by_apartment', (q) => q.eq('apartmentId', apartmentId))
			.collect()
	]);

	return [
		...bookings
			.filter((booking) => BLOCKING_BOOKING_STATUSES.has(booking.status))
			.map((booking) => ({ start: booking.checkInDate, end: booking.checkOutDate })),
		...blocks.map((block) => ({ start: block.startDate, end: block.endDate }))
	];
}

function projectAccommodationForBook(
	apartment: Doc<'apartments'>,
	host: {
		name?: string;
		image?: string | null;
		createdAt?: number;
		isSuperhost?: boolean | null;
	} | null,
	bookedRanges: typesAccommodationEnriched['bookedRanges']
): typesAccommodationEnriched {
	return {
		_id: apartment._id,
		slug: apartment.slug,

		title: apartment.title,
		description: apartment.description,
		type: apartment.type,

		address: apartment.address,
		city: apartment.city,
		country: apartment.country,
		coordinates: apartment.coordinates,
		timeZone: apartment.timeZone,

		bedrooms: apartment.bedrooms,
		bathrooms: apartment.bathrooms,
		maxGuests: apartment.maxGuests,
		squareMeters: apartment.squareMeters,

		pricePerNight: apartment.pricePerNight,
		discountAmount: apartment.discountAmount,
		cleaningFee: apartment.cleaningFee,
		// The listing's model — the book/detail quote composes platformFee from it (ASD §8).
		monetization: apartment.monetization,
		weekendPremium: apartment.weekendPremium,
		weeklyDiscount: apartment.weeklyDiscount,
		monthlyDiscount: apartment.monthlyDiscount,
		currency: apartment.currency,

		instantBooking: apartment.instantBooking,
		paymentMethod: apartment.paymentMethod ?? 'cash',
		sameDayReservation: apartment.sameDayReservation,
		singleDayReservation: apartment.singleDayReservation,
		petsAllowed: apartment.petsAllowed,
		smokingAllowed: apartment.smokingAllowed,
		partiesAllowed: apartment.partiesAllowed,
		minReservationDays: apartment.minReservationDays,
		maxReservationDays: apartment.maxReservationDays,
		checkInTime: apartment.checkInTime,
		checkOutTime: apartment.checkOutTime,
		quietHoursStart: apartment.quietHoursStart,
		quietHoursEnd: apartment.quietHoursEnd,

		amenities: apartment.amenities,
		images: apartment.images,
		houseRules: apartment.houseRules,

		host: {
			id: apartment.hostId,
			name: host?.name ?? 'Host',
			avatarUrl: host?.image ?? undefined,
			joinedAt: host?.createdAt ?? apartment._creationTime,
			isSuperhost: apartment.isSuperhost ?? host?.isSuperhost ?? false
		},

		bookedRanges
	};
}

/**
 * Public accommodation payload for `/accommodation/[slug]/book`.
 *
 * Same curated {@link typesAccommodationEnriched} projection as the detail page, but includes
 * `bookedRanges` so the checkout calendar can grey out reserved nights. Only published
 * accommodations are returned — pending/suspended/archived reads as not-found.
 */
export const fetchAccommodationBySlugForBookSafe = query({
	args: { slug: v.string() },
	handler: async (ctx, { slug }): Promise<typesAccommodationEnriched | null> => {
		const apartment = await ctx.db
			.query('apartments')
			.withIndex('by_slug', (q) => q.eq('slug', slug))
			.first();

		if (!apartment || apartment.status !== 'published') return null;

		const host = (await authComponent.getAnyUserById(ctx, apartment.hostId)) as {
			name?: string;
			image?: string | null;
			createdAt?: number;
			isSuperhost?: boolean | null;
		} | null;

		const bookedRanges = await fetchBookedRanges(ctx, apartment._id);

		return projectAccommodationForBook(apartment, host, bookedRanges);
	}
});
