// LIBRARIES
import { v } from 'convex/values';

// UTILS
import { authMutation } from '@/convex/auth/middleware/authMiddleware';
import { authComponent } from '@/convex/auth/auth';
import { num, optNum, optStr } from '@/convex/utils/convexValidationUtils';
import { r2PublicUrl } from '@/convex/storage/r2/r2';

// SCHEMAS
import { apartmentType, coordinates, paymentMethod } from '../schemas/accommodationsSchemas';
import { createResult, type CreateResult } from '@/convex/schemas/schemas';

/**
 * Create an apartment listing owned by the signed-in host.
 *
 * `authMutation` injects `ctx.userId` (the caller) and rate-limits per user.
 * Numeric args are declared as strings because that's what the form submits;
 * they're coerced in the handler (see {@link num}).
 *
 * Photos arrive as `photos`: the R2 object keys produced by the form's upload
 * pipeline (optimize → PUT to R2 → `uploadedFilesR2` row). They're mapped to
 * `images` in submission order.
 *
 * Backend-derived fields (not collected from the form): `hostId` (caller),
 * `isSuperhost` (denormalized from the host user), `slug` (from title),
 * `currency` ('EUR'), `status` ('pending_review'), `isFeatured` (false),
 * `updatedAt` (now). Payment/published fields are left unset.
 */
export const createApartment = authMutation('createApartment')({
	args: {
		// Basics
		title: v.string(),
		type: apartmentType,
		description: v.string(),

		// Location — `placeId` (merged city+country) / `coordinates` come from the Google place.
		placeId: v.optional(v.string()),
		address: v.string(),
		addressNumber: v.optional(v.string()),
		city: v.string(),
		country: v.optional(v.string()),
		coordinates: v.optional(coordinates),
		timeZone: v.optional(v.string()),

		// Capacity (numbers-as-strings)
		bedrooms: v.string(),
		bathrooms: v.string(),
		maxGuests: v.string(),
		squareMeters: v.string(),

		// Pricing (whole euros, numbers-as-strings)
		pricePerNight: v.string(),
		cleaningFee: v.optional(v.string()),
		weekendPremium: v.optional(v.string()),
		discountAmount: v.optional(v.string()),
		weeklyDiscount: v.optional(v.string()),
		monthlyDiscount: v.optional(v.string()),

		// Booking rules
		paymentMethod,
		minReservationDays: v.string(),
		maxReservationDays: v.optional(v.string()),
		checkInTime: v.string(),
		checkOutTime: v.string(),
		quietHoursStart: v.optional(v.string()),
		quietHoursEnd: v.optional(v.string()),
		instantBooking: v.boolean(),
		sameDayReservation: v.boolean(),
		singleDayReservation: v.boolean(),
		petsAllowed: v.boolean(),
		smokingAllowed: v.boolean(),
		partiesAllowed: v.boolean(),

		// Amenities + house rules
		amenities: v.array(v.string()),
		houseRules: v.optional(v.string()),

		// Photos — R2 object keys from the form's upload pipeline.
		photos: v.optional(v.array(v.string()))
	},
	returns: createResult,
	handler: async (ctx, args): Promise<CreateResult> => {
		const title = args.title.trim();

		// Denormalize the host's superhost flag onto the listing so search/list reads never
		// join to the auth component (see fetchSearchAccommodationsSafe). One read, at create.
		const host = await authComponent.getAuthUser(ctx);

		// URL-friendly slug; short base36 suffix keeps it unique enough for the MVP.
		const slugBase =
			title
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/^-+|-+$/g, '')
				.slice(0, 60) || 'apartment';
		const slug = `${slugBase}-${Date.now().toString(36)}`;

		await ctx.db.insert('apartments', {
			// `hostId` is the better-auth user id stored as a plain string.
			hostId: ctx.userId,
			// Denormalized host reputation (see schema + handler note above).
			isSuperhost: (host as { isSuperhost?: boolean | null } | null)?.isSuperhost ?? false,

			title,
			slug,
			description: args.description.trim(),
			type: args.type,

			address: args.address.trim(),
			addressNumber: optStr(args.addressNumber),
			city: args.city.trim(),
			country: optStr(args.country),
			placeId: optStr(args.placeId),
			coordinates: args.coordinates,
			timeZone: optStr(args.timeZone),

			bedrooms: num(args.bedrooms),
			bathrooms: num(args.bathrooms),
			maxGuests: num(args.maxGuests),
			squareMeters: num(args.squareMeters),

			pricePerNight: num(args.pricePerNight),
			discountAmount: optNum(args.discountAmount),
			cleaningFee: optNum(args.cleaningFee),
			weekendPremium: optNum(args.weekendPremium),
			monthlyDiscount: optNum(args.monthlyDiscount),
			weeklyDiscount: optNum(args.weeklyDiscount),
			currency: 'EUR',

			instantBooking: args.instantBooking,
			paymentMethod: args.paymentMethod,
			sameDayReservation: args.sameDayReservation,
			singleDayReservation: args.singleDayReservation,
			petsAllowed: args.petsAllowed,
			smokingAllowed: args.smokingAllowed,
			partiesAllowed: args.partiesAllowed,
			minReservationDays: num(args.minReservationDays, 1),
			maxReservationDays: optNum(args.maxReservationDays),
			checkInTime: args.checkInTime,
			checkOutTime: args.checkOutTime,
			quietHoursStart: optStr(args.quietHoursStart),
			quietHoursEnd: optStr(args.quietHoursEnd),

			amenities: args.amenities,

			// R2 object keys → ordered listing photos. Store the permanent public URL
			// now so reads never pay for a presigned `getUrl`.
			images: (args.photos ?? []).map((key, order) => ({
				key,
				url: r2PublicUrl(key),
				order
			})),

			houseRules: optStr(args.houseRules),

			status: 'pending_review',
			isFeatured: false,
			updatedAt: Date.now()
		});

		return { success: true, message: { key: 'GenericMessages.ACCOMMODATION_CREATED' } };
	}
});
