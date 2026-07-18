// LIBRARIES
import { v, type ObjectType } from 'convex/values';

// UTILS
import { authMutation, adminMutation } from '@/convex/auth/middleware/authMiddleware';
import { authComponent } from '@/convex/auth/auth';
import { sendCreateAccommodationEmail } from '@/convex/email/sendCreateAccommodationEmail';
import { num, optNum, optStr } from '@/shared/utils/validationUtils';
import { r2PublicUrl } from '@/convex/storage/r2/r2';

// SCHEMAS
import { apartmentType, coordinates, apartmentPaymentMethod } from '../schemas/accommodationsSchemas';
import { mutationResult, type MutationResult } from '@/convex/schemas/schemas';

// TYPES
import type { Doc } from '@/convex/_generated/dataModel';

/**
 * Shared form args for the host + admin create mutations. Numeric args are
 * declared as strings because that's what the form submits; they're coerced in
 * {@link buildApartmentDoc} (see {@link num}).
 */
const apartmentFormArgs = {
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
	paymentMethod: apartmentPaymentMethod,
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
	photos: v.optional(v.array(v.string())),

	locale: v.optional(v.string())
};

type ApartmentFormArgs = ObjectType<typeof apartmentFormArgs>;

/**
 * Map the raw (strings) form args + ownership/status onto an `apartments` insert
 * doc. Single source of truth for the host and admin create mutations.
 */
function buildApartmentDoc(
	args: ApartmentFormArgs,
	owner: { hostId: string; isSuperhost: boolean },
	status: Doc<'apartments'>['status']
): Omit<Doc<'apartments'>, '_id' | '_creationTime'> {
	const title = args.title.trim();

	// URL-friendly slug; short base36 suffix keeps it unique enough for the MVP.
	const slugBase =
		title
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '')
			.slice(0, 60) || 'apartment';

	return {
		// `hostId` is the better-auth user id stored as a plain string.
		hostId: owner.hostId,
		// Denormalized host reputation so search/list reads never join to the auth
		// component (see fetchSearchAccommodationsSafe). One read, at create.
		isSuperhost: owner.isSuperhost,

		title,
		slug: `${slugBase}-${Date.now().toString(36)}`,
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

		// R2 object keys → ordered accommodation photos. Store the permanent public URL
		// now so reads never pay for a presigned `getUrl`.
		images: (args.photos ?? []).map((key, order) => ({
			key,
			url: r2PublicUrl(key),
			order
		})),

		houseRules: optStr(args.houseRules),

		status,
		isFeatured: false,
		updatedAt: Date.now()
	};
}

/**
 * Create an apartment accommodation owned by the signed-in host.
 *
 * `authMutation` injects `ctx.userId` (the caller) and rate-limits per user.
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
	args: apartmentFormArgs,
	returns: mutationResult,
	handler: async (ctx, args): Promise<MutationResult> => {
		const host = await authComponent.getAuthUser(ctx);

		const doc = buildApartmentDoc(
			args,
			{
				hostId: ctx.userId,
				isSuperhost: (host as { isSuperhost?: boolean | null } | null)?.isSuperhost ?? false
			},
			'pending_review'
		);
		const apartmentId = await ctx.db.insert('apartments', doc);

		const hostEmail = host?.email?.trim();
		if (hostEmail) {
			await sendCreateAccommodationEmail(ctx, {
				locale: args.locale ?? 'en',
				apartmentId,
				hostName: host?.name?.trim() || 'Host',
				hostEmail,
				apartmentTitle: doc.title,
				city: doc.city,
				live: false
			});
		}

		return { success: true, message: { key: 'GenericMessages.ACCOMMODATION_CREATED' } };
	}
});

/**
 * Admin creates a accommodation on behalf of a user (`hostId` — mandatory). The admin
 * is the moderator, so the accommodation goes straight to `published` (no self-review
 * round-trip) and the owner gets the "your accommodation is live" email.
 */
export const createApartmentAdmin = adminMutation('createApartmentAdmin')({
	args: {
		...apartmentFormArgs,
		hostId: v.string()
	},
	returns: mutationResult,
	handler: async (ctx, args): Promise<MutationResult> => {
		const owner = await authComponent.getAnyUserById(ctx, args.hostId);
		if (!owner) {
			return { success: false, message: { key: 'GenericMessages.USER_NOT_FOUND' } };
		}

		const doc = buildApartmentDoc(
			args,
			{
				hostId: args.hostId,
				isSuperhost: (owner as { isSuperhost?: boolean | null }).isSuperhost ?? false
			},
			'published'
		);
		const apartmentId = await ctx.db.insert('apartments', doc);

		ctx.audit('apartment.create', {
			resource: { table: 'apartments', id: apartmentId },
			metadata: { onBehalfOf: args.hostId, status: 'published' }
		});

		const ownerEmail = owner.email?.trim();
		if (ownerEmail) {
			await sendCreateAccommodationEmail(ctx, {
				locale: args.locale ?? 'en',
				apartmentId,
				hostName: owner.name?.trim() || 'Host',
				hostEmail: ownerEmail,
				apartmentTitle: doc.title,
				city: doc.city,
				live: true
			});
		}

		return { success: true, message: { key: 'GenericMessages.ACCOMMODATION_CREATED' } };
	}
});
