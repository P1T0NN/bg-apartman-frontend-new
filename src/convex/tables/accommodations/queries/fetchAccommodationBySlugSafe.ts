// LIBRARIES
import { v } from 'convex/values';

// SERVER
import { query } from '@/convex/_generated/server';

// UTILS
import { authComponent } from '@/convex/auth/auth';

// TYPES
import type { typesAccommodationForViewer } from '@/shared/features/accommodation/types/accommodationTypes';

/**
 * Public accommodation detail for `/accommodation/[slug]`.
 *
 * "Safe": returns a curated projection (no owner/internal fields), and only for
 * **published** accommodations — a pending/suspended/archived row reads as
 * not-found so unlisted apartments can't be probed by slug.
 *
 * Exception: **admins** can open unpublished accommodations (the moderation
 * "Review" flow). For those, the payload also carries `adminMeta` with the
 * fields the public projection hides. Once published, `adminMeta` is omitted —
 * admins see the page exactly like guests.
 *
 * Performance: a single `by_slug` index lookup plus one host-user read for the host card —
 * no table scans. `isSuperhost` prefers the denormalized apartment flag, falling back to
 * the host user.
 *
 * `bookedRanges` is returned empty — the detail page's panel is just a "check availability"
 * link, so it doesn't need reserved nights.
 */
export const fetchAccommodationBySlugSafe = query({
	args: { slug: v.string() },
	handler: async (ctx, { slug }): Promise<typesAccommodationForViewer | null> => {
		const apartment = await ctx.db
			.query('apartments')
			.withIndex('by_slug', (q) => q.eq('slug', slug))
			.first();

		if (!apartment) return null;

		let isAdminPreview = false;
		if (apartment.status !== 'published') {
			const viewer = await authComponent.getAuthUser(ctx);
			if ((viewer as { role?: string } | null)?.role !== 'admin') return null;
			isAdminPreview = true;
		}

		const host = (await authComponent.getAnyUserById(ctx, apartment.hostId)) as {
			name?: string;
			image?: string | null;
			createdAt?: number;
			isSuperhost?: boolean | null;
		} | null;

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

			bookedRanges: [],

			// Hidden fields, exposed only while an admin previews an unpublished row.
			...(isAdminPreview && {
				adminMeta: {
					status: apartment.status,
					hostId: apartment.hostId,
					addressNumber: apartment.addressNumber,
					placeId: apartment.placeId,
					isFeatured: apartment.isFeatured,
					moderatedAt: apartment.moderatedAt,
					moderatedBy: apartment.moderatedBy,
					moderationReason: apartment.moderationReason,
					paidAt: apartment.paidAt,
					paymentAmount: apartment.paymentAmount,
					apartmentSubscriptionExpiryDate: apartment.apartmentSubscriptionExpiryDate,
					updatedAt: apartment.updatedAt,
					createdAt: apartment._creationTime
				}
			})
		};
	}
});
