// LIBRARIES
import { v, type Infer } from 'convex/values';
import { zodToConvexFields } from 'convex-helpers/server/zod4';

// UTILS
import { authMutation, zAdminMutation } from '@/convex/auth/middleware/authMiddleware';
import { authComponent } from '@/convex/auth/auth';
import { AUDIT_ACTIONS } from '@/convex/tables/auditLog/auditLogConfigs';
import { sendAccommodationPublishedEmail } from '@/convex/email/sendAccommodationPublishedEmail';
import { sendAccommodationSuspendedEmail } from '@/convex/email/sendAccommodationSuspendedEmail';
import { optStr } from '@/shared/utils/validationUtils';
import { r2PublicUrl } from '@/convex/storage/r2/r2';
import { validateImageCount } from '@/shared/features/accommodation/utils/validateImageCount';
import { splitRegionPlaceId } from '@/shared/features/accommodation/utils/splitRegionPlaceId';
import { ensureHostPayoutAccount } from '@/convex/payments/onboarding';
import { onlinePaymentsEnabled } from '@/convex/payments/adapter';
import {
	listingIsBookingFee,
	listingFeeState
} from '@/shared/features/accommodation/utils/listingFeeState';

// HELPERS
import { deleteApartmentImageKeys } from '../helpers/deleteApartmentImages';

// SCHEMAS
import { apartmentImage } from '../schemas/accommodationsSchemas';
import {
	moderateAccommodationSchema,
	updateAccommodationSchema
} from '@/shared/features/accommodation/schemas/accommodationsSchemas';
import { mutationResult, type MutationResult } from '@/convex/schemas/schemas';

type ApartmentImage = Infer<typeof apartmentImage>;

const forbiddenResult = (): MutationResult => ({
	success: false,
	message: { key: 'GenericMessages.FORBIDDEN' }
});

/**
 * Edit an existing apartment accommodation owned by the signed-in host.
 *
 * Args are DERIVED from the shared `updateAccommodationSchema` (`zodToConvexFields`) — the
 * same field rules as create, plus the accommodation `id` and the photo-reconciliation
 * inputs — and the handler re-runs it authoritatively:
 *  - `keepImageKeys` — existing image keys to keep, in display order.
 *  - `photos` — R2 object keys for newly uploaded images (from the form's upload
 *    pipeline), appended after the kept ones.
 *
 * Images the host removed (present on the doc but absent from `keepImageKeys`) are
 * cleaned out of R2. `slug` and moderation `status` are intentionally left
 * untouched — see the inline note.
 */
export const updateApartment = authMutation('updateApartment')({
	args: zodToConvexFields(updateAccommodationSchema.shape),
	returns: mutationResult,
	handler: async (ctx, rawArgs): Promise<MutationResult> => {
		const parsed = updateAccommodationSchema.safeParse(rawArgs);
		if (!parsed.success) {
			return { success: false, message: { key: 'GenericMessages.UNEXPECTED_ERROR' } };
		}
		const args = parsed.data;

		const apartment = await ctx.db.get(args.id);
		if (!apartment || apartment.hostId !== ctx.userId) return forbiddenResult();

		// A listing cannot offer `online` while no provider is wired (PaymentsSystemDesign.md
		// §8) — the form hides those options, and this is the server-side truth behind it.
		if (args.paymentMethod !== 'cash' && !onlinePaymentsEnabled()) {
			return { success: false, message: { key: 'GenericMessages.ONLINE_PAYMENTS_UNAVAILABLE' } };
		}

		// `booking_fee` listings are online-only by construction (ASD §8) — an edit cannot
		// reopen the cash door the model closed. The edit surface never accepts
		// `monetization` itself (A3); this guards the coupled field.
		if (listingIsBookingFee(apartment) && args.paymentMethod !== 'online') {
			return { success: false, message: { key: 'GenericMessages.BOOKING_FEE_REQUIRES_ONLINE' } };
		}

		// Reconcile photos: keep the chosen existing images (in the requested order;
		// default to all current images when the field wasn't sent), append the freshly
		// uploaded ones, then renumber `order`. Whatever the host dropped is removed from R2.
		const keepKeys = args.keepImageKeys;
		const keptOrdered: ApartmentImage[] = keepKeys
			.map((key) => apartment.images.find((image) => image.key === key))
			.filter((image): image is ApartmentImage => image !== undefined);

		const added: ApartmentImage[] = args.photos.map((key) => ({
			key,
			url: r2PublicUrl(key),
			order: 0
		}));

		const images: ApartmentImage[] = [...keptOrdered, ...added].map((image, order) => ({
			...image,
			order
		}));

		// Checked on the RECONCILED set — an edit that drops photos below the floor is just
		// as invalid as a create that never had them (ASD §3).
		const photoCountError = validateImageCount(images.length);
		if (photoCountError) return { success: false, message: photoCountError };

		const keepSet = new Set(keepKeys);
		const removedKeys = apartment.images
			.map((image) => image.key)
			.filter((key) => !keepSet.has(key));
		if (removedKeys.length) await deleteApartmentImageKeys(ctx, removedKeys);

		// Everything below is what the shared schema PRODUCED — trimmed strings and real
		// numbers. `optStr` is storage normalization only: an optional text column should
		// hold `undefined`, never `''`.
		await ctx.db.patch(args.id, {
			title: args.title,
			description: args.description,
			type: args.type,

			address: args.address ?? '',
			addressNumber: optStr(args.addressNumber),
			city: args.city,
			country: optStr(args.country),
			placeId: optStr(args.placeId),
			// Derived here, never accepted from the client — one source of truth for the split.
			...splitRegionPlaceId(optStr(args.placeId)),
			coordinates: args.coordinates,
			timeZone: optStr(args.timeZone),

			bedrooms: args.bedrooms,
			bathrooms: args.bathrooms,
			maxGuests: args.maxGuests,
			squareMeters: args.squareMeters,

			pricePerNight: args.pricePerNight,
			discountAmount: args.discountAmount,
			cleaningFee: args.cleaningFee,
			weekendPremium: args.weekendPremium,
			monthlyDiscount: args.monthlyDiscount,
			weeklyDiscount: args.weeklyDiscount,

			instantBooking: args.instantBooking,
			paymentMethod: args.paymentMethod,
			sameDayReservation: args.sameDayReservation,
			singleDayReservation: args.singleDayReservation,
			petsAllowed: args.petsAllowed,
			smokingAllowed: args.smokingAllowed,
			partiesAllowed: args.partiesAllowed,
			minReservationDays: args.minReservationDays,
			maxReservationDays: args.maxReservationDays,
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

		// Stage 2 (PaymentsSystemDesign.md §2): flipping a listing to online creates the
		// host's recipient account silently, with what we already know. The host is asked for
		// nothing — that ask waits until they have earnings (stage 3). Best-effort by design:
		// a failure here never fails the edit.
		if (args.paymentMethod !== 'cash') await ensureHostPayoutAccount(ctx, apartment.hostId);

		return { success: true, message: { key: 'GenericMessages.ACCOMMODATION_UPDATED' } };
	}
});

/**
 * Host-controlled accommodation visibility. Hosts may only archive (hide) their accommodation
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

		// `suspended` is admin-owned in AND out (AccommodationsSystemDesign.md §1): a host
		// can't resubmit their way out of a suspension — that's a conversation with the
		// platform, not a queue to re-enter. Archiving it stays their exit.
		if (apartment.status === 'suspended' && args.status === 'pending_review') {
			return { success: false, message: { key: 'GenericMessages.SUSPENDED_CANNOT_RESUBMIT' } };
		}

		await ctx.db.patch(args.id, { status: args.status, updatedAt: Date.now() });

		return { success: true, message: { key: 'GenericMessages.ACCOMMODATION_STATUS_UPDATED' } };
	}
});

/**
 * Admin moderation: publish, suspend or archive a accommodation. Hosts cannot set these
 * statuses themselves — see {@link setApartmentStatus}.
 *
 * - `published` → host gets the "your accommodation is live" email.
 * - `suspended` → requires a `reason`; host gets the suspension email carrying it.
 * - `archived` → no email.
 *
 * Every call stamps `moderatedAt` / `moderatedBy` / `moderationReason` on the row and
 * writes an `apartment.moderate` audit entry.
 */
export const moderateApartmentStatus = zAdminMutation('moderateApartmentStatus')({
	// The whole shared schema IS the args — no parallel v.* block (zAuthMutation pattern).
	args: moderateAccommodationSchema,
	handler: async (ctx, args): Promise<MutationResult> => {
		const apartment = await ctx.db.get(args.id);
		if (!apartment) {
			return { success: false, message: { key: 'GenericMessages.FORBIDDEN' } };
		}
		if (args.status === 'suspended' && !args.reason) {
			return { success: false, message: { key: 'GenericMessages.MODERATION_REASON_REQUIRED' } };
		}

		// The ONE publish precondition beyond content review (ASD §8): an unpaid
		// `listing_fee` listing may not go live. The queue's payment chip explains this
		// refusal before it happens; payment lands via `renewListing` or the admin stamp.
		if (args.status === 'published' && listingFeeState(apartment).kind === 'unpaid') {
			return { success: false, message: { key: 'GenericMessages.LISTING_FEE_UNPAID' } };
		}

		await ctx.db.patch(args.id, {
			status: args.status,
			moderatedAt: Date.now(),
			moderatedBy: ctx.userId,
			moderationReason: args.reason,
			updatedAt: Date.now()
		});

		ctx.audit(AUDIT_ACTIONS.APARTMENT_MODERATE, {
			resource: { table: 'apartments', id: args.id },
			before: { status: apartment.status },
			after: { status: args.status },
			metadata: { reason: args.reason ?? null }
		});

		const host = await authComponent.getAnyUserById(ctx, apartment.hostId);

		const hostEmail = host?.email?.trim();
		if (!hostEmail || args.status === 'archived') {
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
			await sendAccommodationSuspendedEmail(ctx, { ...emailInput, reason: args.reason });
		}

		return { success: true, message: { key: 'GenericMessages.ACCOMMODATION_STATUS_UPDATED' } };
	}
});
