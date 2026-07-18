// LIBRARIES
import { z } from 'zod';

/** Blank string → `undefined`, then a non-negative number; for optional money/count fields. */
const optionalNonNegative = z.preprocess(
	(value) => (value === '' || value == null ? undefined : value),
	z.coerce.number().min(0).optional()
);

// Messages below are Paraglide keys, resolved at display time by `zodIssuesToFieldErrors`.
// The photo/amenity minimums are baked into the catalog copy (e.g. "at least 3 photos");
// ponytail: if you change these constants, update the matching catalog strings too.

/** Minimum photos a accommodation must have before it can be created or saved. */
export const MIN_ACCOMMODATION_PHOTOS = 3;
const MIN_ACCOMMODATION_PHOTOS_MESSAGE = 'ValidationMessages.addAccommodationSchema.photosMin';

/** Minimum amenities a host must select. */
export const MIN_ACCOMMODATION_AMENITIES = 5;

/**
 * Shared field rules for the add + edit accommodation forms. Validates the *raw*
 * form values (strings) and coerces numbers. Spread into each form's schema so the
 * two never drift. Photo rules differ per form (new-only vs. existing + new), so
 * they live in the individual schemas below — not here.
 */
export const accommodationFieldsShape = {
	title: z.string().trim().min(3, 'ValidationMessages.accommodationFieldsShape.titleMin').max(100),
	type: z.enum(['apartment', 'studio', 'penthouse', 'loft', 'duplex', 'house', 'villa'], {
		message: 'ValidationMessages.accommodationFieldsShape.typeRequired'
	}),
	description: z
		.string()
		.trim()
		.min(20, 'ValidationMessages.accommodationFieldsShape.descriptionMin')
		.max(2000),

	// The Places autocomplete is the single address entry; selecting fills `placeId`
	// (the required gate — the accommodation's city+country search key) plus
	// `address`/`city`/`country`/`coordinates`.
	placeId: z.string().trim().min(1, 'ValidationMessages.accommodationFieldsShape.placeIdRequired'),
	address: z.string().trim().optional(),
	addressNumber: z.string().trim().max(20).optional(),
	city: z.string().trim().min(2, 'ValidationMessages.accommodationFieldsShape.cityMin'),
	country: z.string().trim().optional(),
	coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),
	// Resolved from the address pin (Google place → tz-lookup), not user-entered.
	timeZone: z.string().optional(),

	// Studios may have 0 (see each schema's bedrooms refinement); other types need ≥ 1.
	bedrooms: z.coerce
		.number()
		.int()
		.min(0, 'ValidationMessages.accommodationFieldsShape.bedroomsNonNegative')
		.max(50),
	bathrooms: z.coerce
		.number()
		.min(1, 'ValidationMessages.accommodationFieldsShape.bathroomsMin')
		.max(50),
	maxGuests: z.coerce
		.number()
		.int()
		.min(1, 'ValidationMessages.accommodationFieldsShape.maxGuestsMin')
		.max(100),
	squareMeters: z.coerce
		.number()
		.min(1, 'ValidationMessages.accommodationFieldsShape.squareMetersMin')
		.max(10000),

	pricePerNight: z.coerce
		.number()
		.min(1, 'ValidationMessages.accommodationFieldsShape.pricePerNightMin')
		.max(100000),
	cleaningFee: optionalNonNegative,
	weekendPremium: optionalNonNegative,
	discountAmount: optionalNonNegative,
	weeklyDiscount: optionalNonNegative,
	monthlyDiscount: optionalNonNegative,

	minReservationDays: z.coerce
		.number()
		.int()
		.min(1, 'ValidationMessages.accommodationFieldsShape.minReservationDaysMin')
		.max(365),
	maxReservationDays: z.preprocess(
		(value) => (value === '' || value == null ? undefined : value),
		z.coerce.number().int().min(1).max(365).optional()
	),
	checkInTime: z.string().min(1, 'ValidationMessages.accommodationFieldsShape.checkInTimeRequired'),
	checkOutTime: z
		.string()
		.min(1, 'ValidationMessages.accommodationFieldsShape.checkOutTimeRequired'),
	quietHoursStart: z.string().optional(),
	quietHoursEnd: z.string().optional(),

	instantBooking: z.boolean(),
	paymentMethod: z.enum(['cash', 'online', 'both'], {
		message: 'ValidationMessages.accommodationFieldsShape.paymentMethodRequired'
	}),
	sameDayReservation: z.boolean(),
	singleDayReservation: z.boolean(),
	petsAllowed: z.boolean(),
	smokingAllowed: z.boolean(),
	partiesAllowed: z.boolean(),

	amenities: z
		.array(z.string())
		.min(MIN_ACCOMMODATION_AMENITIES, 'ValidationMessages.accommodationFieldsShape.amenitiesMin'),
	houseRules: z.string().trim().max(2000).optional()
};

/**
 * Validates the *raw* add-form values (strings) and coerces numbers. The output type
 * diverges from `AddAccommodationValues` (numbers vs strings) by design — the page
 * casts it to `ZodType<AddAccommodationValues>` when handing it to the form.
 *
 * `photos` (the selected `File[]`) must hold at least {@link MIN_ACCOMMODATION_PHOTOS}.
 */
export const addAccommodationSchema = z
	.object({
		...accommodationFieldsShape,
		photos: z.array(z.unknown()).min(MIN_ACCOMMODATION_PHOTOS, MIN_ACCOMMODATION_PHOTOS_MESSAGE)
	})
	.superRefine((data, ctx) => {
		// Studios are open-plan (0 separate bedrooms); every other type needs at least 1.
		if (data.type !== 'studio' && data.bedrooms < 1) {
			ctx.addIssue({
				code: 'custom',
				path: ['bedrooms'],
				message: 'ValidationMessages.accommodationFieldsShape.bedroomsRequired'
			});
		}
	});
