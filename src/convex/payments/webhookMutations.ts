// LIBRARIES
import { v } from 'convex/values';
import { internalMutation } from '@/convex/functions';

// CONFIG
import { HOST_RESPONSE_MS } from '@/shared/config';

// UTILS
import { authComponent } from '@/convex/auth/auth';
import { analytics, ANALYTICS_EVENT, hostAnalyticsScope } from '@/convex/analytics';
import { trackBookingNights } from '@/convex/tables/bookings/helpers/trackBookingNights';
import { sendCreateBookingEmail } from '@/convex/email/sendCreateBookingEmail';
import { sendBookingAutoDeclinedEmail } from '@/convex/email/sendBookingAutoDeclinedEmail';
import { applyAutoDecline } from '@/shared/features/booking/utils/applyAutoDecline';
import { hasAvailabilityConflict } from '@/convex/tables/bookings/helpers/hasAvailabilityConflict';
import { recordCapturedEarnings } from '@/convex/payments/helpers/recordCapturedEarnings';

// TYPES
import type { Doc } from '@/convex/_generated/dataModel';
import type { MutationCtx } from '@/convex/_generated/server';

/**
 * The webhook endpoint's write side (PaymentsSystemDesign.md §3, §6).
 *
 * Every handler here is "load the row → is the target state already written? → no-op or
 * write", which is what makes provider retries and duplicate deliveries harmless without
 * a processed-events table (§6, §12). They are `internalMutation` from `@/convex/functions`
 * because they write `bookings` / `bookingEarnings` — the trigger-wrapped constructors
 * keep the aggregates in sync (GeneralSystemDesignRule.md § table counts).
 *
 * Provider calls (capture, release) live in the httpAction that drives these — a mutation
 * cannot do I/O, and more importantly money must move BEFORE we record that it moved.
 */

/** What the endpoint must do next after an authorization lands. */
const authorizationVerdict = v.union(
	/** Already handled, or the row is gone. Nothing to do. */
	v.literal('noop'),
	/** Dates were confirmed to someone else mid-checkout — release the hold (§3, §11). */
	v.literal('lost_race'),
	/** Instant listing — capture now, then confirm (§3). */
	v.literal('capture')
);

/** The request-mode announcement: the host's clock starts HERE, at authorization (§3). */
async function announceAuthorizedRequest(
	ctx: MutationCtx,
	booking: Doc<'bookings'>,
	apartmentTitle: string,
	/** The pendingExpiresAt just stamped — the owner email states it as a datetime (HSD §6). */
	respondBy: number
): Promise<void> {
	const host = await authComponent.getAnyUserById(ctx, booking.hostId);

	await analytics.track(ctx, ANALYTICS_EVENT.BOOKING_CREATED, {
		properties: { paymentMethod: booking.paymentMethod, instant: false }
	});

	await sendCreateBookingEmail(ctx, {
		// No per-guest locale is stored on the booking; webhook emails default to English.
		locale: 'en',
		bookingId: booking._id,
		bookingCode: booking.bookingCode,
		apartmentTitle,
		checkInDate: booking.checkInDate,
		checkOutDate: booking.checkOutDate,
		numberOfAdults: booking.numberOfAdults,
		numberOfChildren: booking.numberOfChildren,
		total: booking.total,
		currency: booking.currency,
		instantBooking: false,
		respondBy,
		guestFirstName: booking.guestFirstName,
		guestLastName: booking.guestLastName,
		guestEmail: booking.guestEmail,
		guestPhone: booking.guestPhone,
		hostName: host?.name?.trim() || 'Host',
		hostEmail: host?.email?.trim() ?? ''
	});
}

/**
 * Authorization confirmed — the first moment anyone is told anything about an online
 * booking (§3). Stamps `paymentRef` and re-checks availability, because THIS is
 * money-time: the truth that matters is the truth now, not at row creation.
 */
export const applyAuthorization = internalMutation({
	args: { bookingId: v.id('bookings'), paymentRef: v.string() },
	returns: authorizationVerdict,
	handler: async (ctx, args) => {
		const booking = await ctx.db.get(args.bookingId);
		// Not `awaiting` ⇒ this event already landed (or the reaper won). Idempotent no-op.
		if (!booking || booking.paymentStatus !== 'awaiting') return 'noop' as const;

		const now = Date.now();
		const apartment = await ctx.db.get(booking.apartmentId);

		// The same shared availability check the create and confirm paths run, plus the
		// listing-still-bookable check (AccommodationsSystemDesign.md A1).
		const lost =
			!apartment ||
			apartment.status !== 'published' ||
			(await hasAvailabilityConflict(
				ctx,
				booking.apartmentId,
				booking.checkInDate,
				booking.checkOutDate
			));

		if (lost) {
			// Ref stamped so the endpoint can release the hold it belongs to.
			await ctx.db.patch(args.bookingId, { paymentRef: args.paymentRef, updatedAt: now });
			return 'lost_race' as const;
		}

		if (apartment.instantBooking) {
			await ctx.db.patch(args.bookingId, { paymentRef: args.paymentRef, updatedAt: now });
			return 'capture' as const;
		}

		// Request mode: the hold stands, the host has their full window from now, and
		// everyone finally hears about the booking.
		const respondBy = now + HOST_RESPONSE_MS;
		await ctx.db.patch(args.bookingId, {
			paymentStatus: 'authorized',
			paymentRef: args.paymentRef,
			pendingExpiresAt: respondBy,
			updatedAt: now
		});

		await announceAuthorizedRequest(ctx, booking, apartment.title, respondBy);

		return 'noop' as const;
	}
});

/**
 * The guest finished a real checkout for dates that were taken meanwhile. They get a real
 * row and a real page — `auto_declined` with the §6 lost-race copy — and the email says
 * plainly that they were not charged (§3, §11).
 */
export const finalizeLostRace = internalMutation({
	args: { bookingId: v.id('bookings'), released: v.boolean() },
	returns: v.null(),
	handler: async (ctx, args) => {
		const booking = await ctx.db.get(args.bookingId);
		if (!booking || booking.status !== 'pending') return null;

		const patch = applyAutoDecline(booking, 'dates_taken');
		if (!patch) return null;

		await ctx.db.patch(args.bookingId, {
			...patch,
			// Release failed ⇒ payment state stays as it was and a human finishes it (§4).
			...(args.released
				? { paymentStatus: 'released' as const }
				: { paymentFlag: 'release_failed' as const })
		});

		const apartment = await ctx.db.get(booking.apartmentId);

		await sendBookingAutoDeclinedEmail(ctx, {
			locale: 'en',
			reason: 'dates_taken',
			bookingCode: booking.bookingCode,
			guestFirstName: booking.guestFirstName,
			guestEmail: booking.guestEmail,
			apartmentTitle: apartment?.title ?? booking.apartmentSlug,
			checkInDate: booking.checkInDate,
			checkOutDate: booking.checkOutDate
		});

		return null;
	}
});

/**
 * Instant listing, hold captured: the booking becomes `confirmed` + `paid` and the ledger
 * row is written (§3, §5).
 *
 * On capture failure the booking does NOT die — it degrades to the request flow: the hold
 * is still good, so the host gets a normal pending request with the full response window,
 * and the row carries `capture_failed` for the admin. Failures flag, they don't loop
 * (§ FOR LLMs 6); if the host never confirms, the expiry cron releases the hold as usual.
 */
export const finalizeCapture = internalMutation({
	args: { bookingId: v.id('bookings'), captured: v.boolean() },
	returns: v.null(),
	handler: async (ctx, args) => {
		const booking = await ctx.db.get(args.bookingId);
		if (!booking || booking.paymentStatus !== 'awaiting') return null;

		const now = Date.now();
		const apartment = await ctx.db.get(booking.apartmentId);
		const apartmentTitle = apartment?.title ?? booking.apartmentSlug;

		if (!args.captured) {
			const respondBy = now + HOST_RESPONSE_MS;
			await ctx.db.patch(args.bookingId, {
				paymentStatus: 'authorized',
				paymentFlag: 'capture_failed',
				pendingExpiresAt: respondBy,
				updatedAt: now
			});
			await announceAuthorizedRequest(ctx, booking, apartmentTitle, respondBy);
			return null;
		}

		await ctx.db.patch(args.bookingId, {
			paymentStatus: 'paid',
			status: 'confirmed',
			pendingExpiresAt: undefined,
			updatedAt: now
		});

		await recordCapturedEarnings(ctx, { ...booking, paymentStatus: 'paid', status: 'confirmed' });

		await analytics.track(ctx, ANALYTICS_EVENT.BOOKING_CREATED, {
			properties: { paymentMethod: booking.paymentMethod, instant: true }
		});
		await analytics.track(ctx, ANALYTICS_EVENT.BOOKING_CONFIRMED, {
			scopes: [hostAnalyticsScope(booking.hostId)],
			properties: { totalEuros: booking.total, paymentMethod: booking.paymentMethod }
		});
		// Occupancy ledger, split per calendar month — the booking is now earning.
		await trackBookingNights(ctx, booking, 'booked');

		const host = await authComponent.getAnyUserById(ctx, booking.hostId);

		await sendCreateBookingEmail(ctx, {
			locale: 'en',
			bookingId: booking._id,
			bookingCode: booking.bookingCode,
			apartmentTitle,
			checkInDate: booking.checkInDate,
			checkOutDate: booking.checkOutDate,
			numberOfAdults: booking.numberOfAdults,
			numberOfChildren: booking.numberOfChildren,
			total: booking.total,
			currency: booking.currency,
			instantBooking: true,
			guestFirstName: booking.guestFirstName,
			guestLastName: booking.guestLastName,
			guestEmail: booking.guestEmail,
			guestPhone: booking.guestPhone,
			hostName: host?.name?.trim() || 'Host',
			hostEmail: host?.email?.trim() ?? ''
		});

		return null;
	}
});

/**
 * `capture succeeded` arriving on its own — the safety net for a capture call of ours that
 * timed out but actually went through. Out-of-order tolerant: keyed on the payment ref,
 * not on event sequence (§6).
 */
export const applyCaptureConfirmed = internalMutation({
	args: { paymentRef: v.string() },
	returns: v.null(),
	handler: async (ctx, args) => {
		const booking = await ctx.db
			.query('bookings')
			.withIndex('by_payment_ref', (q) => q.eq('paymentRef', args.paymentRef))
			.first();
		if (!booking || booking.paymentStatus !== 'authorized') return null;

		await ctx.db.patch(booking._id, {
			paymentStatus: 'paid',
			paymentFlag: undefined,
			updatedAt: Date.now()
		});
		await recordCapturedEarnings(ctx, { ...booking, paymentStatus: 'paid' });

		return null;
	}
});

/** `refund succeeded` — confirms (or completes) a refund we asked for (§4, §6). */
export const applyRefundConfirmed = internalMutation({
	args: { paymentRef: v.string() },
	returns: v.null(),
	handler: async (ctx, args) => {
		const booking = await ctx.db
			.query('bookings')
			.withIndex('by_payment_ref', (q) => q.eq('paymentRef', args.paymentRef))
			.first();
		if (!booking || booking.paymentStatus === 'refunded') return null;

		await ctx.db.patch(booking._id, {
			paymentStatus: 'refunded',
			paymentFlag: undefined,
			updatedAt: Date.now()
		});

		const earning = await ctx.db
			.query('bookingEarnings')
			.withIndex('by_booking', (q) => q.eq('bookingId', booking._id))
			.first();
		if (earning && earning.status === 'held') {
			await ctx.db.patch(earning._id, { status: 'returned' });
		}

		return null;
	}
});

/**
 * Stage 4 (§2): the provider confirms transfers are active. `transfersActive` is
 * maintained EXCLUSIVELY here — never inferred locally, never read during guest checkout
 * (§0.2, §5).
 */
export const applyAccountCapability = internalMutation({
	args: { providerAccountId: v.string(), transfersActive: v.boolean() },
	returns: v.null(),
	handler: async (ctx, args) => {
		const account = await ctx.db
			.query('hostPayoutAccounts')
			.withIndex('by_provider_account', (q) => q.eq('providerAccountId', args.providerAccountId))
			.first();
		if (!account || account.transfersActive === args.transfersActive) return null;

		await ctx.db.patch(account._id, {
			transfersActive: args.transfersActive,
			updatedAt: Date.now()
		});

		return null;
	}
});

/**
 * Asynchronous transfer outcome (§5). A failure puts the row back to `held` + a flag —
 * the sweep skips flagged rows, so nothing retries until a human clears it.
 */
export const applyTransferResult = internalMutation({
	args: { transferRef: v.string(), succeeded: v.boolean() },
	returns: v.null(),
	handler: async (ctx, args) => {
		const earning = await ctx.db
			.query('bookingEarnings')
			.withIndex('by_transfer_ref', (q) => q.eq('transferRef', args.transferRef))
			.first();
		if (!earning) return null;

		if (args.succeeded) {
			if (earning.status === 'transferred') return null;
			await ctx.db.patch(earning._id, {
				status: 'transferred',
				transferredAt: Date.now(),
				payoutFlag: undefined
			});
			return null;
		}

		await ctx.db.patch(earning._id, {
			status: 'held',
			transferRef: undefined,
			transferredAt: undefined,
			payoutFlag: 'transfer_failed'
		});

		return null;
	}
});
