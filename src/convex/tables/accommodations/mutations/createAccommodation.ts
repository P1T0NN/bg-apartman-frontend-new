// LIBRARIES
import { zodToConvexFields } from 'convex-helpers/server/zod4';

// UTILS
import { authMutation, adminMutation } from '@/convex/auth/middleware/authMiddleware';
import { authComponent } from '@/convex/auth/auth';
import { sendCreateAccommodationEmail } from '@/convex/email/sendCreateAccommodationEmail';
import { optStr } from '@/shared/utils/validationUtils';
import { r2PublicUrl } from '@/convex/storage/r2/r2';
import { validateImageCount } from '@/shared/features/accommodation/utils/validateImageCount';
import { ensureHostPayoutAccount } from '@/convex/payments/onboarding';
import { onlinePaymentsEnabled } from '@/convex/payments/adapter';
import { monetizationActive } from '@/shared/features/accommodation/utils/listingFeeState';

// SCHEMAS
import {
	createAccommodationSchema,
	createAccommodationAdminSchema,
	type CreateAccommodationWireInput
} from '@/shared/features/accommodation/schemas/accommodationsSchemas';
import { mutationResult, type MutationResult } from '@/convex/schemas/schemas';

// TYPES
import type { Doc } from '@/convex/_generated/dataModel';

/**
 * Map the PARSED create input + ownership/status onto an `apartments` insert doc. Single
 * source of truth for the host and admin create mutations.
 *
 * Numbers arrive as numbers: `accommodationFieldsShape` coerces them, so the handler stores
 * exactly what the shared schema produced — no second `Number()` cast to drift from the
 * validation rules. `optStr` is storage normalization, not validation: an optional text
 * column should hold `undefined`, never `''`.
 */
/**
 * The per-listing monetization rules a create must satisfy (ASD §8), config-dependent so
 * they live here beside the image-count rule, not in the schema:
 *  - under `'per_listing'` the choice is REQUIRED — a new listing without a model would be
 *    invisible to every fee surface;
 *  - `booking_fee` listings are online-only by construction (that is what makes the fee
 *    collectable at all).
 * Returns null when fine, a MutationResult error otherwise.
 */
function validateMonetizationChoice(args: {
	monetization?: 'listing_fee' | 'booking_fee';
	paymentMethod: 'cash' | 'online' | 'both';
}): MutationResult | null {
	if (!monetizationActive()) return null;
	if (!args.monetization) {
		return { success: false, message: { key: 'GenericMessages.MONETIZATION_CHOICE_REQUIRED' } };
	}
	if (args.monetization === 'booking_fee' && args.paymentMethod !== 'online') {
		return { success: false, message: { key: 'GenericMessages.BOOKING_FEE_REQUIRES_ONLINE' } };
	}
	return null;
}

function buildApartmentDoc(
	args: CreateAccommodationWireInput,
	owner: { hostId: string; isSuperhost: boolean },
	status: Doc<'apartments'>['status']
): Omit<Doc<'apartments'>, '_id' | '_creationTime'> {
	const title = args.title;

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
		description: args.description,
		type: args.type,

		address: args.address ?? '',
		addressNumber: optStr(args.addressNumber),
		city: args.city,
		country: optStr(args.country),
		placeId: optStr(args.placeId),
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
		currency: 'EUR',

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

		// R2 object keys → ordered accommodation photos. Store the permanent public URL
		// now so reads never pay for a presigned `getUrl`.
		images: args.photos.map((key, order) => ({
			key,
			url: r2PublicUrl(key),
			order
		})),

		houseRules: optStr(args.houseRules),

		// Stored only while monetization exists — rows created under `'none'` stay
		// unstamped so the flip backfill owns them (ASD §8 switch honesty).
		monetization: monetizationActive() ? args.monetization : undefined,

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
 * Args are DERIVED from the shared `createAccommodationSchema` (`zodToConvexFields`) — the
 * wire twin of the form schema the browser validates — and the handler re-runs it
 * authoritatively. Field rules live ONLY in the schema; the DB-dependent rules (image-count
 * config, the online-payments gate) stay here.
 *
 * Photos arrive as `photos`: the R2 object keys produced by the form's upload pipeline
 * (optimize → PUT to R2 → `uploadedFilesR2` row). They're mapped to `images` in order.
 *
 * Backend-derived fields (never from the form): `hostId` (caller), `isSuperhost`,
 * `slug` (from title), `currency`, `status` ('pending_review'), `isFeatured`, `updatedAt`.
 */
export const createApartment = authMutation('createApartment')({
	args: zodToConvexFields(createAccommodationSchema.shape),
	returns: mutationResult,
	handler: async (ctx, rawArgs): Promise<MutationResult> => {
		const parsed = createAccommodationSchema.safeParse(rawArgs);
		if (!parsed.success) {
			return { success: false, message: { key: 'GenericMessages.UNEXPECTED_ERROR' } };
		}
		const args = parsed.data;

		// Config-driven, so it can move without touching the schema (ASD §3).
		const photoCountError = validateImageCount(args.photos.length);
		if (photoCountError) return { success: false, message: photoCountError };

		// Server-side twin of the form's hidden options: no provider wired, no `online`
		// listings (PaymentsSystemDesign.md §8).
		if (args.paymentMethod !== 'cash' && !onlinePaymentsEnabled()) {
			return { success: false, message: { key: 'GenericMessages.ONLINE_PAYMENTS_UNAVAILABLE' } };
		}

		const monetizationError = validateMonetizationChoice(args);
		if (monetizationError) return monetizationError;

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

		// Stage 2 (PaymentsSystemDesign.md §2): silent recipient account, nothing asked of
		// the host. Best-effort — a failure never fails the listing.
		if (args.paymentMethod !== 'cash') await ensureHostPayoutAccount(ctx, ctx.userId);

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
	args: zodToConvexFields(createAccommodationAdminSchema.shape),
	returns: mutationResult,
	handler: async (ctx, rawArgs): Promise<MutationResult> => {
		const parsed = createAccommodationAdminSchema.safeParse(rawArgs);
		if (!parsed.success) {
			return { success: false, message: { key: 'GenericMessages.UNEXPECTED_ERROR' } };
		}
		const args = parsed.data;

		const photoCountError = validateImageCount(args.photos.length);
		if (photoCountError) return { success: false, message: photoCountError };

		if (args.paymentMethod !== 'cash' && !onlinePaymentsEnabled()) {
			return { success: false, message: { key: 'GenericMessages.ONLINE_PAYMENTS_UNAVAILABLE' } };
		}

		const monetizationError = validateMonetizationChoice(args);
		if (monetizationError) return monetizationError;

		const owner = await authComponent.getAnyUserById(ctx, args.hostId);
		if (!owner) {
			return { success: false, message: { key: 'GenericMessages.USER_NOT_FOUND' } };
		}

		// Straight-to-published is the admin privilege — but an unpaid `listing_fee`
		// listing may not be live (ASD §8's publish gate applies to admins too). It lands
		// in review; the admin stamps the payment, then publishes.
		const status =
			monetizationActive() && args.monetization === 'listing_fee'
				? ('pending_review' as const)
				: ('published' as const);

		const doc = buildApartmentDoc(
			args,
			{
				hostId: args.hostId,
				isSuperhost: (owner as { isSuperhost?: boolean | null }).isSuperhost ?? false
			},
			status
		);
		const apartmentId = await ctx.db.insert('apartments', doc);

		if (args.paymentMethod !== 'cash') await ensureHostPayoutAccount(ctx, args.hostId);

		ctx.audit('apartment.create', {
			resource: { table: 'apartments', id: apartmentId },
			metadata: { onBehalfOf: args.hostId, status }
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
				live: status === 'published'
			});
		}

		return { success: true, message: { key: 'GenericMessages.ACCOMMODATION_CREATED' } };
	}
});
