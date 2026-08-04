// LIBRARIES
import { z } from 'zod';
import { zid } from 'convex-helpers/server/zod4';

// CONFIG
import { PROJECT_SETTINGS } from '@/shared/config';

// UTILS
import { nightsBetween } from '@/shared/utils/dateUtils';
import { withinMaxStay } from '@/shared/features/booking/utils/withinMaxStay';

/**
 * Booking schemas — the single source of truth, shared by BOTH sides.
 *
 *   - Convex derives mutation args from these (`zodToConvexFields`, or the whole object as
 *     `zAuthMutation`'s `args`) and validates authoritatively. Semantic rules —
 *     availability, policy windows, payment state — stay in the mutation.
 *   - The client forms and dialogs validate against the same objects pre-submit.
 *
 * **No error messages anywhere in this file, deliberately.** These schemas are bundled into
 * Convex, so a message string here would drag display copy into a backend that never
 * renders a word. The rule lives here; the sentence lives in the client-only error map
 * (`shared/features/validations/data/backendMessages.ts`). The one `.refine` below passes a KEY the map
 * recognises, not a sentence.
 *
 * Framework-free by contract: plain TS + zod only — no `$app`/`$env`, no browser globals.
 */

/** Cross-field rules carry a stable KEY that `zodMessages` maps to copy. */
export const BOOKING_ISSUE = {
	MIN_ONE_NIGHT: 'ValidationMessages.Booking.minOneNight',
	MAX_STAY_NIGHTS: 'ValidationMessages.Booking.maxStayNights'
} as const;

// ─── Guest-facing forms ───────────────────────────────────────────────────────

/**
 * The booking guest-details FORM shape (one key per rendered field). `mapArgs` on the book
 * form renames these onto the mutation's `guest*` wire names — see
 * {@link createBookingWireSchema}.
 *
 * The trip dates aren't rendered fields — they're picked in the sibling "Your trip"
 * calendar — but the page mirrors them into the form `values`, so the cross-field night
 * check below gates submission too.
 */
export const createBookingFormSchema = z
	.object({
		firstName: z.string().trim().min(1),
		lastName: z.string().trim().min(1),
		email: z.string().trim().pipe(z.email()),
		phone: z.string().refine((value) => value.replace(/\D/g, '').length >= 6),
		specialRequests: z.string().trim().optional(),
		paymentMethod: z.enum(['cash', 'online']),
		// Required strings (not nullable): `z.infer` then narrows these to `string` for the
		// mutation — the same narrowing the old `resolveBookingDates` return type gave us.
		checkIn: z.string().min(1),
		checkOut: z.string().min(1)
	})
	// Cross-field rule: needs both dates, so it lives on the object via `.refine`, not a field.
	.refine((data) => nightsBetween(data.checkIn, data.checkOut) >= 1, {
		params: { key: BOOKING_ISSUE.MIN_ONE_NIGHT },
		path: ['checkOut']
	})
	.refine((data) => withinMaxStay(data.checkIn, data.checkOut), {
		params: { key: BOOKING_ISSUE.MAX_STAY_NIGHTS, max: PROJECT_SETTINGS.MAX_STAY_NIGHTS },
		path: ['checkOut']
	});

export type CreateBookingFormInput = z.infer<typeof createBookingFormSchema>;

/**
 * Wire shape — what `createBooking` receives. Guest fields carry the `guest*` prefix they
 * are stored under; the form's flat names are mapped onto these at submit.
 *
 * Quantities and dates are validated here; everything semantic (availability, listing
 * status, payment-method acceptance, duplicate requests) stays in the mutation, which
 * re-runs this schema authoritatively.
 */
export const createBookingSchema = z
	.object({
		apartmentSlug: z.string().min(1),
		hostId: z.string().min(1),

		guestFirstName: z.string().trim().min(1),
		guestLastName: z.string().trim().min(1),
		guestEmail: z.string().trim().pipe(z.email()),
		guestPhone: z.string().refine((value) => value.replace(/\D/g, '').length >= 6),
		specialRequests: z.string().trim().optional(),

		checkInDate: z.string().min(1),
		checkOutDate: z.string().min(1),
		numberOfAdults: z.number().int().min(1),
		numberOfChildren: z.number().int().min(0),

		paymentMethod: z.enum(['cash', 'online']),
		instantBooking: z.boolean(),
		locale: z.string().optional()
	})
	.refine((data) => nightsBetween(data.checkInDate, data.checkOutDate) >= 1, {
		params: { key: BOOKING_ISSUE.MIN_ONE_NIGHT },
		path: ['checkOutDate']
	})
	.refine((data) => withinMaxStay(data.checkInDate, data.checkOutDate), {
		params: { key: BOOKING_ISSUE.MAX_STAY_NIGHTS, max: PROJECT_SETTINGS.MAX_STAY_NIGHTS },
		path: ['checkOutDate']
	});

export type typesCreateBookingInput = z.infer<typeof createBookingSchema>;

/**
 * The `/reservations` recovery form (GuestSystemDesign.md §3), and the wire shape of
 * `findMyReservation`. The code is normalized server-side — this only gates "both fields
 * look plausible".
 */
export const findMyReservationSchema = z.object({
	bookingCode: z.string().trim().min(1),
	email: z.string().trim().pipe(z.email())
});

export type FindMyReservationInput = z.infer<typeof findMyReservationSchema>;

// ─── Mutation args (host + admin) ─────────────────────────────────────────────

/**
 * Full argument schema for the `declineBooking` mutation.
 *
 * Passed whole to `zAuthMutation` as its `args`, so the Convex boundary validates against
 * exactly this. The decline AlertDialog reuses it — no field schema is duplicated anywhere.
 * `declineReason` output is already trimmed; the "≥ 4 characters" rule lives only here.
 */
export const declineBookingSchema = z.object({
	bookingId: zid('bookings'),
	declineReason: z.string().trim().min(4).max(500),
	locale: z.string().optional()
});

export type typesDeclineBookingInput = z.infer<typeof declineBookingSchema>;

/**
 * Full argument schema for the `cancelBookingOwner` mutation.
 *
 * The reason is mandatory, same as declining: cancelling a confirmed stay is a real event
 * the guest reads about in their email (BookingSystemDesign.md §8's "+ reason"), and
 * "Cancelled by host." with no explanation is exactly the message that turns a guest into
 * a support ticket.
 */
export const cancelBookingOwnerSchema = z.object({
	bookingId: zid('bookings'),
	cancelReason: z.string().trim().min(4).max(500),
	locale: z.string().optional()
});

export type typesCancelBookingOwnerInput = z.infer<typeof cancelBookingOwnerSchema>;

/**
 * Full argument schema for the `cancelBookingAdmin` mutation — the admin emergency brake.
 * The admin cancel dialog reuses it via `.pick({ cancelReason: true })`.
 */
export const cancelBookingAdminSchema = z.object({
	bookingId: zid('bookings'),
	cancelReason: z.string().trim().min(4).max(500),
	locale: z.string().optional()
});

export type typesCancelBookingAdminInput = z.infer<typeof cancelBookingAdminSchema>;
