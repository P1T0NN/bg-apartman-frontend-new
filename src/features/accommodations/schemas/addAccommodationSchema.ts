// LIBRARIES
import { z } from 'zod';

/** Blank string → `undefined`, then a non-negative number; for optional money/count fields. */
const optionalNonNegative = z.preprocess(
	(value) => (value === '' || value == null ? undefined : value),
	z.coerce.number().min(0).optional()
);

/**
 * Validates the *raw* form values (strings) and coerces numbers. The output type
 * diverges from `AddAccommodationValues` (numbers vs strings) by design — the page
 * casts it to `ZodType<AddAccommodationValues>` when handing it to the form.
 */
export const addAccommodationSchema = z
	.object({
		title: z.string().trim().min(3, 'Give your place a title (min 3 characters).').max(100),
		type: z.enum(['apartment', 'studio', 'penthouse', 'loft', 'duplex', 'house', 'villa'], {
			message: 'Choose a property type.'
		}),
		description: z
			.string()
			.trim()
			.min(20, 'Add a short description (at least 20 characters).')
			.max(2000),

		// The Places autocomplete is the single address entry; it sets `cityPlaceId`
		// (the required gate) plus `address`/`city`/`country`/`coordinates` on select.
		cityPlaceId: z.string().min(1, 'Search and select your address from the list.'),
		address: z.string().trim().optional(),
		city: z.string().trim().min(2, 'Enter the city.'),
		country: z.string().trim().optional(),
		coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),

		// Studios may have 0 (see the object-level refinement below); other types need ≥ 1.
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
		sameDayReservation: z.boolean(),
		singleDayReservation: z.boolean(),
		petsAllowed: z.boolean(),
		smokingAllowed: z.boolean(),
		partiesAllowed: z.boolean(),

		amenities: z.array(z.string()),
		houseRules: z.string().trim().max(2000).optional()
	})
	.superRefine((data, ctx) => {
		// Studios are open-plan (0 separate bedrooms); every other type needs at least 1.
		if (data.type !== 'studio' && data.bedrooms < 1) {
			ctx.addIssue({ code: 'custom', path: ['bedrooms'], message: 'At least one bedroom.' });
		}
	});
