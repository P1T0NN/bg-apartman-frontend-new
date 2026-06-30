// LIBRARIES
import { z } from 'zod';

/** Blank string → `undefined`, then a non-negative number; for optional money/count fields. */
const optionalNonNegative = z.preprocess(
	(value) => (value === '' || value == null ? undefined : value),
	z.coerce.number().min(0).optional()
);

/** Minimum photos a listing must have before it can be created or saved. */
export const MIN_ACCOMMODATION_PHOTOS = 3;
const MIN_ACCOMMODATION_PHOTOS_MESSAGE = `Please upload at least ${MIN_ACCOMMODATION_PHOTOS} photos.`;

/** Minimum amenities a host must select. */
export const MIN_ACCOMMODATION_AMENITIES = 5;

/**
 * Shared field rules for the add + edit accommodation forms. Validates the *raw*
 * form values (strings) and coerces numbers. Spread into each form's schema so the
 * two never drift. Photo rules differ per form (new-only vs. existing + new), so
 * they live in the individual schemas below — not here.
 */
export const accommodationFieldsShape = {
	title: z.string().trim().min(3, 'Give your place a title (min 3 characters).').max(100),
	type: z.enum(['apartment', 'studio', 'penthouse', 'loft', 'duplex', 'house', 'villa'], {
		message: 'Choose a property type.'
	}),
	description: z
		.string()
		.trim()
		.min(20, 'Add a short description (at least 20 characters).')
		.max(2000),

	// The Places autocomplete is the single address entry; selecting fills `placeId`
	// (the required gate — the listing's city+country search key) plus
	// `address`/`city`/`country`/`coordinates`.
	placeId: z.string().trim().min(1, 'Select your city from the list (typing alone won’t set it).'),
	address: z.string().trim().optional(),
	addressNumber: z.string().trim().max(20).optional(),
	city: z.string().trim().min(2, 'Enter the city.'),
	country: z.string().trim().optional(),
	coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),
	// Resolved from the address pin (Google place → tz-lookup), not user-entered.
	timeZone: z.string().optional(),

	// Studios may have 0 (see each schema's bedrooms refinement); other types need ≥ 1.
	bedrooms: z.coerce.number().int().min(0, 'Cannot be negative.').max(50),
	bathrooms: z.coerce.number().min(1, 'At least one bathroom.').max(50),
	maxGuests: z.coerce.number().int().min(1, 'At least one guest.').max(100),
	squareMeters: z.coerce.number().min(1, 'Enter the size in m².').max(10000),

	pricePerNight: z.coerce.number().min(1, 'Set a nightly price.').max(100000),
	cleaningFee: optionalNonNegative,
	weekendPremium: optionalNonNegative,
	discountAmount: optionalNonNegative,
	weeklyDiscount: optionalNonNegative,
	monthlyDiscount: optionalNonNegative,

	minReservationDays: z.coerce.number().int().min(1, 'Minimum 1 night.').max(365),
	maxReservationDays: z.preprocess(
		(value) => (value === '' || value == null ? undefined : value),
		z.coerce.number().int().min(1).max(365).optional()
	),
	checkInTime: z.string().min(1, 'Set a check-in time.'),
	checkOutTime: z.string().min(1, 'Set a check-out time.'),
	quietHoursStart: z.string().optional(),
	quietHoursEnd: z.string().optional(),

	instantBooking: z.boolean(),
	paymentMethod: z.enum(['cash', 'online'], { message: 'Choose how guests can pay.' }),
	sameDayReservation: z.boolean(),
	singleDayReservation: z.boolean(),
	petsAllowed: z.boolean(),
	smokingAllowed: z.boolean(),
	partiesAllowed: z.boolean(),

	amenities: z
		.array(z.string())
		.min(MIN_ACCOMMODATION_AMENITIES, `Select at least ${MIN_ACCOMMODATION_AMENITIES} amenities.`),
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
			ctx.addIssue({ code: 'custom', path: ['bedrooms'], message: 'At least one bedroom.' });
		}
	});
