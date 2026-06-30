// LIBRARIES
import { v, type Infer } from 'convex/values';

// UTILS
import { authMutation, adminMutation } from '@/convex/auth/middleware/authMiddleware';
import { authComponent } from '@/convex/auth/auth';
import { sendAccommodationPublishedEmail } from '@/convex/email/sendAccommodationPublishedEmail';
import { sendAccommodationSuspendedEmail } from '@/convex/email/sendAccommodationSuspendedEmail';
import { num, optNum, optStr } from '@/shared/utils/validationUtils';
import { r2PublicUrl } from '@/convex/storage/r2/r2';

// HELPERS
import { deleteApartmentImageKeys } from '../helpers/deleteApartmentImages';

// SCHEMAS
import {
	apartmentType,
	coordinates,
	apartmentImage,
	paymentMethod
} from '../schemas/accommodationsSchemas';
import { mutationResult, type MutationResult } from '@/convex/schemas/schemas';

type ApartmentImage = Infer<typeof apartmentImage>;

const forbiddenResult = (): MutationResult => ({
	success: false,
	message: { key: 'GenericMessages.FORBIDDEN' }
});

/**
 * Edit an existing apartment listing owned by the signed-in host.
 *
 * Same numbers-as-strings arg shape as {@link createApartment}, plus the listing
 * `id` and the photo-reconciliation inputs:
 *  - `keepImageKeys` — existing image keys to keep, in display order.
 *  - `photos` — R2 object keys for newly uploaded images (from the form's upload
 *    pipeline), appended after the kept ones.
 *
 * Images the host removed (present on the doc but absent from `keepImageKeys`) are
 * cleaned out of R2. `slug` and moderation `status` are intentionally left
 * untouched — see the inline note.
 */
export const updateApartment = authMutation('updateApartment')({
	args: {
		id: v.id('apartments'),

		// Basics
		title: v.string(),
		type: apartmentType,
		description: v.string(),

		// Location
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

		// Photos — existing keys to keep (ordered) + new R2 keys to append.
		keepImageKeys: v.optional(v.array(v.string())),
		photos: v.optional(v.array(v.string()))
	},
	returns: mutationResult,
	handler: async (ctx, args): Promise<MutationResult> => {
		const apartment = await ctx.db.get(args.id);
		if (!apartment || apartment.hostId !== ctx.userId) return forbiddenResult();

		// Reconcile photos: keep the chosen existing images (in the requested order;
		// default to all current images when the field wasn't sent), append the freshly
		// uploaded ones, then renumber `order`. Whatever the host dropped is removed from R2.
		const keepKeys = args.keepImageKeys ?? apartment.images.map((image) => image.key);
		const keptOrdered: ApartmentImage[] = keepKeys
			.map((key) => apartment.images.find((image) => image.key === key))
			.filter((image): image is ApartmentImage => image !== undefined);

		const added: ApartmentImage[] = (args.photos ?? []).map((key) => ({
			key,
			url: r2PublicUrl(key),
			order: 0
		}));

		const images: ApartmentImage[] = [...keptOrdered, ...added].map((image, order) => ({
			...image,
			order
		}));

		const keepSet = new Set(keepKeys);
		const removedKeys = apartment.images
			.map((image) => image.key)
			.filter((key) => !keepSet.has(key));
		if (removedKeys.length) await deleteApartmentImageKeys(ctx, removedKeys);

		await ctx.db.patch(args.id, {
			title: args.title.trim(),
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
			images,
			houseRules: optStr(args.houseRules),

			// ponytail: keep slug + moderation status stable on edit. Regenerate the slug
			// only once we add old→new redirects; editing shouldn't silently re-trigger review.
			updatedAt: Date.now()
		});

		return { success: true, message: { key: 'GenericMessages.ACCOMMODATION_UPDATED' } };
	}
});

/**
 * Host-controlled listing visibility. Hosts may only archive (hide) their listing
 * or send it back for review — `published` / `suspended` stay moderation-gated, so
 * the arg validator only accepts those two transitions.
 */
export const setApartmentStatus = authMutation('setApartmentStatus')({
	args: {
		id: v.id('apartments'),
		status: v.union(v.literal('archived'), v.literal('pending_review'))
	},
	returns: mutationResult,
	handler: async (ctx, args): Promise<MutationResult> => {
		const apartment = await ctx.db.get(args.id);
		if (!apartment || apartment.hostId !== ctx.userId) return forbiddenResult();

		await ctx.db.patch(args.id, { status: args.status, updatedAt: Date.now() });

		return { success: true, message: { key: 'GenericMessages.ACCOMMODATION_STATUS_UPDATED' } };
	}
});

/**
 * Admin moderation: publish or suspend a listing. Hosts cannot set these statuses
 * themselves — see {@link setApartmentStatus}.
 */
export const moderateApartmentStatus = adminMutation('moderateApartmentStatus')({
	args: {
		id: v.id('apartments'),
		status: v.union(v.literal('published'), v.literal('suspended')),
		locale: v.optional(v.string())
	},
	returns: mutationResult,
	handler: async (ctx, args): Promise<MutationResult> => {
		const apartment = await ctx.db.get(args.id);
		if (!apartment) {
			return { success: false, message: { key: 'GenericMessages.FORBIDDEN' } };
		}

		await ctx.db.patch(args.id, { status: args.status, updatedAt: Date.now() });

		const host = await authComponent.getAnyUserById(ctx, apartment.hostId);

		const hostEmail = host?.email?.trim();
		if (!hostEmail) {
			return { success: true, message: { key: 'GenericMessages.ACCOMMODATION_STATUS_UPDATED' } };
		}

		const locale = args.locale ?? 'en';
		const hostName = host?.name?.trim() || 'Host';
		const emailInput = {
			locale,
			apartmentId: args.id,
			hostName,
			hostEmail,
			apartmentTitle: apartment.title
		};

		if (args.status === 'published') {
			await sendAccommodationPublishedEmail(ctx, { ...emailInput, city: apartment.city });
		} else {
			await sendAccommodationSuspendedEmail(ctx, emailInput);
		}

		return { success: true, message: { key: 'GenericMessages.ACCOMMODATION_STATUS_UPDATED' } };
	}
});
