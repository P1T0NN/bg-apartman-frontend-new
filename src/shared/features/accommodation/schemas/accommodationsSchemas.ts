// LIBRARIES
import { z } from 'zod';
import { zid } from 'convex-helpers/server/zod4';

/**
 * Accommodation schemas — the single source of truth, shared by BOTH sides.
 *
 *   - Convex derives mutation args from these (`zodToConvexFields`) and re-runs
 *     `safeParse` authoritatively in the handler. Only DB-dependent rules (slug
 *     collisions, ownership, image-count config) live in the mutation.
 *   - The client forms validate against the same objects pre-submit.
 *
 * **No error messages anywhere in this file, deliberately.** These schemas are bundled
 * into Convex, so any message string here would drag display copy — and eventually an i18n
 * runtime — into a backend that never renders a word. Zod already separates *what is
 * invalid* from *how you say so*: the rule lives here, the sentence lives in the client-only
 * error map (`src/utils/zodMessages.ts`). The two `.superRefine` calls below are
 * the one exception, and they pass a KEY that the error map recognises.
 *
 * Framework-free by contract: plain TS + zod only — no `$app`/`$env`, no browser globals,
 * no `.svelte`. That is what lets Convex bundle this file; keep it that way.
 */

// ─── Refinement keys ──────────────────────────────────────────────────────────

/**
 * Cross-field rules can't be expressed by a zod primitive, so they carry a stable KEY that
 * `zodMessages` maps to copy. Not a sentence — the backend must never hold display text.
 *
 * Passed as `params: { key }`, never as `message`: an explicit `message` makes zod SKIP the
 * global error map entirely, which would leak the raw key into the UI.
 */
export const ACCOMMODATION_ISSUE = {
	BEDROOMS_REQUIRED: 'accommodation.bedroomsRequired',
	PHOTOS_MIN_TOTAL: 'accommodation.photosMinTotal',
	/** Marks a field invalid for styling without printing a second sentence. */
	SILENT: 'silent'
} as const;

// ─── Shared field rules ───────────────────────────────────────────────────────

/** Blank string → `undefined`, then a non-negative number; for optional money/count fields. */
const optionalNonNegative = z.preprocess(
	(value) => (value === '' || value == null ? undefined : value),
	z.coerce.number().min(0).optional()
);

/** Minimum photos a accommodation must have before it can be created or saved. */
export const MIN_ACCOMMODATION_PHOTOS = 3;

/** Minimum amenities a host must select. */
export const MIN_ACCOMMODATION_AMENITIES = 5;

export const ACCOMMODATION_TYPE_VALUES = [
	'apartment',
	'studio',
	'penthouse',
	'loft',
	'duplex',
	'house',
	'villa'
] as const;

/**
 * Shared field rules for the add + edit accommodation forms AND the create/update
 * mutations. Numbers are `z.coerce` so the same rules accept the form's raw strings and
 * emit real numbers — the mutation stores what the schema produced, never a hand-rolled
 * `Number()` cast. Photo rules differ per surface (new-only vs existing + new), so they
 * live in the individual schemas below.
 */
export const accommodationFieldsShape = {
	title: z.string().trim().min(3).max(100),
	type: z.enum(ACCOMMODATION_TYPE_VALUES),
	description: z.string().trim().min(20).max(2000),

	// The Places autocomplete is the single address entry; selecting fills `placeId`
	// (the required gate — the accommodation's city+country search key) plus
	// `address`/`city`/`country`/`coordinates`.
	placeId: z.string().trim().min(1),
	address: z.string().trim().optional(),
	addressNumber: z.string().trim().max(20).optional(),
	city: z.string().trim().min(2),
	country: z.string().trim().optional(),
	coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),
	// Resolved from the address pin (Google place → tz-lookup), not user-entered.
	timeZone: z.string().optional(),

	// Studios may have 0 (see the refinement below); other types need ≥ 1.
	bedrooms: z.coerce.number().int().min(0).max(50),
	bathrooms: z.coerce.number().min(1).max(50),
	maxGuests: z.coerce.number().int().min(1).max(100),
	squareMeters: z.coerce.number().min(1).max(10000),

	pricePerNight: z.coerce.number().min(1).max(100000),
	cleaningFee: optionalNonNegative,
	weekendPremium: optionalNonNegative,
	discountAmount: optionalNonNegative,
	weeklyDiscount: optionalNonNegative,
	monthlyDiscount: optionalNonNegative,

	minReservationDays: z.coerce.number().int().min(1).max(365),
	maxReservationDays: z.preprocess(
		(value) => (value === '' || value == null ? undefined : value),
		z.coerce.number().int().min(1).max(365).optional()
	),
	checkInTime: z.string().min(1),
	checkOutTime: z.string().min(1),
	quietHoursStart: z.string().optional(),
	quietHoursEnd: z.string().optional(),

	instantBooking: z.boolean(),
	paymentMethod: z.enum(['cash', 'online', 'both']),
	sameDayReservation: z.boolean(),
	singleDayReservation: z.boolean(),
	petsAllowed: z.boolean(),
	smokingAllowed: z.boolean(),
	partiesAllowed: z.boolean(),

	amenities: z.array(z.string()).min(MIN_ACCOMMODATION_AMENITIES),
	houseRules: z.string().trim().max(2000).optional()
};

/** Studios are open-plan (0 separate bedrooms); every other type needs at least 1. */
function requireBedroomsUnlessStudio(
	data: { type: string; bedrooms: number },
	ctx: z.RefinementCtx
): void {
	if (data.type !== 'studio' && data.bedrooms < 1) {
		ctx.addIssue({
			code: 'custom',
			path: ['bedrooms'],
			params: { key: ACCOMMODATION_ISSUE.BEDROOMS_REQUIRED }
		});
	}
}

// ─── Wire shapes (what the Convex mutations receive) ──────────────────────────

/**
 * Wire shape — what `createApartment` receives. `photos` are already-uploaded R2 object
 * keys: the form uploads the picked `File`s on submit and swaps in the keys before the
 * mutation call, which is the only difference from the form schema below.
 */
export const createAccommodationSchema = z
	.object({
		...accommodationFieldsShape,
		photos: z.array(z.string()),
		locale: z.string().optional()
	})
	.superRefine(requireBedroomsUnlessStudio);

/** Wire twin for the edit mutation: kept existing keys + newly uploaded ones. */
export const updateAccommodationSchema = z
	.object({
		...accommodationFieldsShape,
		id: zid('apartments'),
		keepImageKeys: z.array(z.string()),
		photos: z.array(z.string()),
		locale: z.string().optional()
	})
	.superRefine(requireBedroomsUnlessStudio);

/** Admin create — same wire shape plus the mandatory owner picked in the Owner field. */
export const createAccommodationAdminSchema = z
	.object({
		...accommodationFieldsShape,
		hostId: z.string().min(1),
		photos: z.array(z.string()),
		locale: z.string().optional()
	})
	.superRefine(requireBedroomsUnlessStudio);

export type CreateAccommodationWireInput = z.infer<typeof createAccommodationSchema>;
export type UpdateAccommodationWireInput = z.infer<typeof updateAccommodationSchema>;

// ─── Form shapes (what the browser validates before upload) ───────────────────

/**
 * Client form model — `photos` holds picked `File`s (typed `unknown` so this module never
 * references the `File` global, which the Convex runtime lacks). The form uploads them and
 * replaces the array with R2 keys, producing {@link createAccommodationSchema}'s shape.
 */
export const addAccommodationSchema = z
	.object({
		...accommodationFieldsShape,
		photos: z.array(z.unknown()).min(MIN_ACCOMMODATION_PHOTOS)
	})
	.superRefine(requireBedroomsUnlessStudio);

/**
 * Edit-form validation. Same field rules, but the photo minimum counts the accommodation's
 * *existing* kept images plus newly uploaded ones, so a accommodation that already has
 * photos doesn't need 3 brand-new uploads. The error is attached to `photos` so it surfaces
 * on the uploader.
 */
export const editAccommodationSchema = z
	.object({
		...accommodationFieldsShape,
		keepImageKeys: z.array(z.string()),
		photos: z.array(z.unknown())
	})
	.superRefine((data, ctx) => {
		requireBedroomsUnlessStudio(data, ctx);

		if (data.keepImageKeys.length + data.photos.length < MIN_ACCOMMODATION_PHOTOS) {
			ctx.addIssue({
				code: 'custom',
				path: ['photos'],
				params: { key: ACCOMMODATION_ISSUE.PHOTOS_MIN_TOTAL }
			});
			// Mirror the failure onto the existing-photos field so its grid is outlined
			// too. The SILENT key keeps the visible text to a single copy (under the
			// uploader) while still marking the field invalid for styling.
			ctx.addIssue({
				code: 'custom',
				path: ['keepImageKeys'],
				params: { key: ACCOMMODATION_ISSUE.SILENT }
			});
		}
	});

/** Admin add-accommodation form — the form model twin of `createAccommodationAdminSchema`. */
export const adminAddAccommodationSchema = z
	.object({
		...accommodationFieldsShape,
		hostId: z.string().min(1),
		photos: z.array(z.unknown()).min(MIN_ACCOMMODATION_PHOTOS)
	})
	.superRefine(requireBedroomsUnlessStudio);

// ─── Moderation ───────────────────────────────────────────────────────────────

/** The suspend dialog validates its textarea against this before submitting. */
export const moderationReasonSchema = z.string().trim().min(4).max(500);

/**
 * Full argument schema for the `moderateApartmentStatus` mutation.
 *
 * `reason` is optional here so approve/archive need no reason; the "suspend requires a
 * reason" rule lives in the mutation handler (and the suspend dialog validates it with
 * {@link moderationReasonSchema} before submitting).
 */
export const moderateAccommodationSchema = z.object({
	id: zid('apartments'),
	status: z.enum(['published', 'suspended', 'archived']),
	reason: moderationReasonSchema.optional(),
	locale: z.string().optional()
});
