// LIBRARIES
import { v } from 'convex/values';
import { zodToConvexFields } from 'convex-helpers/server/zod4';
import { mutation } from '@/convex/functions';

// CONFIG
import { ONLINE_PAYMENTS_AVAILABLE, PAYMENTS_CONFIG } from '@/shared/config';

// UTILS
import { authComponent } from '@/convex/auth/auth';
import { getAuthUserId } from '@/convex/auth/helpers/getAuthUserId';
import { convexRateLimiter } from '@/convex/convexRateLimiter';
import { analytics, ANALYTICS_EVENT, recordGmv, recordNights } from '@/convex/analytics';
import { sendCreateBookingEmail } from '@/convex/email/sendCreateBookingEmail';
import { calculatePrice } from '@/shared/features/pricing/utils/calculatePrice';
import { makeBookingCode } from '@/shared/features/booking/utils/makeBookingCode';
import { nightsBetween } from '@/shared/utils/dateUtils';

// SCHEMAS
import { createBookingSchema } from '@/shared/features/booking/schemas/bookingsSchemas';
import { pendingExpiresAtFrom } from '@/shared/features/booking/utils/pendingExpiresAtFrom';
import { currentBookingPolicySnapshot } from '@/shared/features/booking/utils/currentBookingPolicySnapshot';
import { mutationResultData } from '@/convex/schemas/schemas';
import { hasAvailabilityConflict } from '@/convex/tables/bookings/helpers/hasAvailabilityConflict';
import { findOpenDuplicateRequest } from '@/convex/tables/bookings/helpers/findOpenDuplicateRequest';

const bookingData = v.object({
	bookingId: v.id('bookings'),
	bookingCode: v.string(),
	/**
	 * Online bookings only: the row is `awaiting` and invisible until the guest pays. The
	 * caller must send them to `createCheckoutSession`'s redirect URL rather than straight
	 * to the reservation page (PaymentsSystemDesign.md §3).
	 */
	checkoutRequired: v.optional(v.boolean())
});

/**
 * Create a guest booking and return its id + human-readable code.
 *
 * Public (no auth): guests book without an account. The returned `bookingId` is the
 * unguessable access key for `/reservations/[id]`; `bookingCode` is the short code shown
 * to the guest and used for support lookups. Status is `confirmed` for instant-book
 * accommodations, otherwise `pending` (host review). Cash payment is `on_arrival` end to
 * end — the platform never witnesses the handover.
 *
 * Args are DERIVED from the shared `createBookingSchema` (`zodToConvexFields`) — the wire
 * twin of the form schema the browser validates — and the handler re-runs it
 * authoritatively. Shape rules (required fields, email format, ≥ 1 night) live only in the
 * schema; everything semantic below (availability, listing status, payment-method
 * acceptance, duplicates) stays here, where the database is.
 */
export const createBooking = mutation({
	args: zodToConvexFields(createBookingSchema.shape),
	returns: mutationResultData(bookingData),
	handler: async (ctx, rawArgs) => {
		// Authoritative run of the shared schema (the form's pre-submit check is advisory).
		// A failure means a client bypassed validation — generic envelope, no per-issue copy.
		const parsed = createBookingSchema.safeParse(rawArgs);
		if (!parsed.success) {
			return {
				success: false,
				message: { key: 'GenericMessages.INVALID_BOOKING_DATES' }
			};
		}
		// Trimmed + coerced by the schema, so the handler never re-cleans a field.
		const args = parsed.data;

		// Public endpoint (guests book without an account), and the most expensive one on the
		// platform: every request mails the host and lands in their queue. Two buckets, charged
		// before ANY read or write so a refused call costs nothing — per guest email against a
		// loop, plus one platform-wide floor for an attacker rotating addresses.
		const rateLimitKey = args.guestEmail.toLowerCase();
		await convexRateLimiter.limit(ctx, 'createBooking', { key: rateLimitKey, throws: true });
		await convexRateLimiter.limit(ctx, 'createBookingFloor', { throws: true });

		const numberOfNights = nightsBetween(args.checkInDate, args.checkOutDate);

		const apartment = await ctx.db
			.query('apartments')
			.withIndex('by_slug', (q) => q.eq('slug', args.apartmentSlug))
			.first();

		if (!apartment || apartment.status !== 'published' || apartment.hostId !== args.hostId) {
			return {
				success: false,
				message: { key: 'GenericMessages.INVALID_BOOKING_DATES' }
			};
		}

		// The guest's payment method must be one the apartment accepts ('both' → either).
		const acceptedPayment = apartment.paymentMethod ?? 'cash';
		if (acceptedPayment !== 'both' && args.paymentMethod !== acceptedPayment) {
			return {
				success: false,
				message: { key: 'GenericMessages.PAYMENT_METHOD_NOT_ACCEPTED' }
			};
		}

		// The dark-ship gate, enforced server-side rather than trusted from the form: while
		// `PROVIDER: 'none'` or Phase 2 is not shipped there is no checkout to send the guest
		// to, so an online request must not create an `awaiting` row that can never be
		// finished. Legacy listings stamped `online`/`both` before the gate existed are
		// covered by this too.
		const isOnline = args.paymentMethod === 'online';
		if (isOnline && !ONLINE_PAYMENTS_AVAILABLE) {
			return {
				success: false,
				message: { key: 'GenericMessages.PAYMENT_METHOD_NOT_ACCEPTED' }
			};
		}

		// Double-submit guard: the same guest asking for the same stay twice gets their
		// existing request back, not a second row in the host's queue (GSD §2). Checked
		// before availability so a duplicate never trips the "dates unavailable" path.
		const duplicate = await findOpenDuplicateRequest(
			ctx,
			apartment._id,
			args.guestEmail,
			args.checkInDate,
			args.checkOutDate
		);
		if (duplicate) {
			return {
				success: true,
				message: { key: 'GenericMessages.BOOKING_ALREADY_REQUESTED' },
				data: { bookingId: duplicate._id, bookingCode: duplicate.bookingCode }
			};
		}

		// Double-booking guard: reject if a confirmed/checked-in booking or a host calendar
		// block covers the requested nights. Runs inside the mutation, so Convex's
		// transactional serialization makes two simultaneous submissions for the same dates
		// impossible to both succeed. Other `pending` requests are NOT a conflict — the host
		// picks a winner at confirm time (BookingSystemDesign.md §6).
		if (await hasAvailabilityConflict(ctx, apartment._id, args.checkInDate, args.checkOutDate)) {
			return {
				success: false,
				message: { key: 'GenericMessages.DATES_UNAVAILABLE' }
			};
		}

		// Price is derived from the accommodation server-side — never trusted from the client. The
		// apartment doc carries the `pricePerNight` / `discountAmount` / `cleaningFee` /
		// `weekendPremium` shape `calculatePrice` expects; dates are passed so the Fri/Sat
		// override lands on the exact nights it owns.
		const quote = calculatePrice(apartment, args.checkInDate, args.checkOutDate);

		const bookingCode = makeBookingCode();
		const now = Date.now();
		const isInstant = args.instantBooking;
		// Cash request only — online rows get their clock at the authorization webhook.
		const pendingExpiresAt = isInstant || isOnline ? undefined : pendingExpiresAtFrom(now);

		const hostUser = (await authComponent.getAnyUserById(ctx, args.hostId)) as {
			name?: string;
			email?: string;
		} | null;

		const bookingId = await ctx.db.insert('bookings', {
			bookingCode,
			apartmentId: apartment._id,
			apartmentSlug: args.apartmentSlug,
			hostId: args.hostId,

			// Already trimmed by the schema — the handler stores what the parse produced.
			guestFirstName: args.guestFirstName,
			guestLastName: args.guestLastName,
			// Lowercased so `by_guest_email` lookups (the account claim, support search) match
			// whatever casing the guest typed — GuestSystemDesign.md §1.
			guestEmail: args.guestEmail.toLowerCase(),
			// Stamped when the booker is signed in, whatever email they typed
			// (GuestSystemDesign.md §1/§9). Anonymous bookings join an account later via
			// `claimMyBookings`.
			guestId: (await getAuthUserId(ctx)) ?? undefined,
			guestPhone: args.guestPhone,
			specialRequests: args.specialRequests || undefined,

			checkInDate: args.checkInDate,
			checkOutDate: args.checkOutDate,
			numberOfAdults: args.numberOfAdults,
			numberOfChildren: args.numberOfChildren,
			numberOfNights,

			subtotal: quote.accommodationTotal,
			cleaningFee: quote.cleaningFee,
			// Derived from ACCOMMODATIONS_CONFIG by `calculatePrice`; 0 outside
			// `booking_fee` mode. Snapshotted here so a later config change can never
			// reprice this booking.
			platformFee: quote.platformFee,
			total: quote.total,
			currency: 'EUR',

			paymentMethod: args.paymentMethod,
			// Cash is `on_arrival` end to end — the platform never witnesses the handover.
			//
			// Online opens a checkout instead: the row exists, nobody has been told anything,
			// and it stays that way until the authorization webhook lands
			// (PaymentsSystemDesign.md §3). An `awaiting` booking is invisible — no emails, no
			// host queue entry, no host clock (an abandoned checkout must not eat the host's
			// 48h window), and no dates blocked (`pending` never blocks dates anyway). Instant
			// listings are `pending` here too: they become `confirmed` inside the webhook,
			// after capture.
			paymentStatus: isOnline ? 'awaiting' : 'on_arrival',
			paymentDeadlineAt: isOnline
				? now + PAYMENTS_CONFIG.CHECKOUT_DEADLINE_MINUTES * 60_000
				: undefined,
			status: isInstant && !isOnline ? 'confirmed' : 'pending',
			// Frozen so later config changes can never move THIS booking's windows.
			policy: currentBookingPolicySnapshot(),
			pendingExpiresAt,

			updatedAt: now
		});

		// Nothing is announced for an online booking yet — not to the guest, not to the host,
		// not to analytics. The webhook owns all of that at authorization; a checkout the
		// guest abandons is reaped without ever having been a fact (§3, §11).
		if (isOnline) {
			return {
				success: true,
				message: { key: 'GenericMessages.BOOKING_CREATED' },
				data: { bookingId, bookingCode, checkoutRequired: true }
			};
		}

		if (isInstant) {
			await analytics.track(ctx, ANALYTICS_EVENT.BOOKING_CONFIRMED, { hostId: args.hostId });
			// Money + occupancy rollups — only instant bookings are earning at creation. A
			// `pending` request's nights are counted when the host confirms.
			await recordGmv(ctx, { _id: bookingId, hostId: args.hostId, total: quote.total }, 'confirmed');
			await recordNights(
				ctx,
				{ _id: bookingId, hostId: args.hostId, checkInDate: args.checkInDate, checkOutDate: args.checkOutDate },
				'booked'
			);
		}

		const hostEmail = hostUser?.email?.trim();

		await sendCreateBookingEmail(ctx, {
			locale: args.locale ?? 'en',
			bookingId,
			bookingCode,
			apartmentTitle: apartment.title,
			checkInDate: args.checkInDate,
			checkOutDate: args.checkOutDate,
			numberOfAdults: args.numberOfAdults,
			numberOfChildren: args.numberOfChildren,
			total: quote.total,
			currency: 'EUR',
			instantBooking: args.instantBooking,
			respondBy: pendingExpiresAt,
			guestFirstName: args.guestFirstName,
			guestLastName: args.guestLastName,
			guestEmail: args.guestEmail,
			guestPhone: args.guestPhone,
			hostName: hostUser?.name?.trim() || 'Host',
			hostEmail: hostEmail ?? ''
		});

		return {
			success: true,
			message: { key: 'GenericMessages.BOOKING_CREATED' },
			data: { bookingId, bookingCode }
		};
	}
});
