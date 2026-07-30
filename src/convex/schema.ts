// LIBRARIES
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

// TABLES
import { auditLogTable } from './tables/auditLog/schemas/auditLogSchema';

// SCHEMAS
import {
	apartmentType,
	apartmentStatus,
	apartmentExpiredReason,
	paymentMethod,
	apartmentPaymentMethod,
	coordinates,
	apartmentImage
} from './tables/accommodations/schemas/accommodationsSchemas';
import {
	bookingStatus,
	paymentStatus,
	paymentFlag,
	cancelledBy,
	bookingPolicy,
	bookingEarningStatus
} from './tables/bookings/schemas/bookingsSchemas';
import { reportCategory, reportStatus } from './tables/reports/schemas/reportsSchemas';

const schema = defineSchema({
	// Users (with `role` and other custom fields) live in the better-auth component;
	// access via `authComponent.getAuthUser(ctx)`. Foreign-key columns below store the
	// better-auth user id as a plain string.

	// Audit logs — toggle population via FEATURES.AUDIT_LOGS in shared/config.ts.
	// The table itself is always declared so flipping the flag needs no migration.
	auditLogs: auditLogTable,

	/** Cloudflare R2 file reference + cached download URL. Owner-stamped at upload. */
	uploadedFilesR2: defineTable({
		ownerId: v.string(),
		key: v.string(),
		url: v.string()
	})
		.index('by_key', ['key'])
		.index('by_owner', ['ownerId']),

	/** Convex file storage reference. Kept registered for the storage fallback path. */
	uploadedFiles: defineTable({
		ownerId: v.string(),
		storageId: v.id('_storage'),
		url: v.string()
	})
		.index('by_storage_id', ['storageId'])
		.index('by_owner', ['ownerId']),

	apartments: defineTable({
		// === OWNERSHIP ===
		// Better-auth user id stored as a plain string (no `users` table in this
		// deployment — see the schema note above). Matches `uploadedFilesR2.ownerId`.
		hostId: v.string(),
		// Denormalized from the host user (better-auth `user.isSuperhost`) so search/list
		// reads never join to the auth component — see fetchSearchAccommodationsSafe. Stamped
		// at create; optional so rows predating this field stay valid (readers treat as false).
		// ponytail: re-stamp on host status change (and in updateApartment) to bound drift.
		isSuperhost: v.optional(v.boolean()),

		// === BASIC INFO ===
		title: v.string(),
		slug: v.string(), // URL-friendly identifier
		description: v.string(),
		type: apartmentType,

		// === LOCATION ===
		address: v.string(),
		// House/street number, entered manually (kept separate from the route name).
		addressNumber: v.optional(v.string()),
		city: v.string(),
		country: v.optional(v.string()),
		// The accommodation's city + country Google place ids, space-joined into one string (e.g.
		// "<cityId> <countryId>"). Resolved via Places Autocomplete at save — the same source the
		// search box uses — so the ids are identical and language-independent ("Beograd" and
		// "Belgrade" share a place id). Search matches when the picked place id is one of the parts,
		// so a accommodation surfaces for a city search AND a country search.
		placeId: v.optional(v.string()),
		coordinates: v.optional(coordinates),
		// IANA zone resolved from the pin (e.g. 'Europe/Belgrade'). The availability
		// calendar runs in this zone, not the viewer's. Optional for rows created before
		// resolution existed — readers fall back to DEFAULT_TIME_ZONE in shared/config.ts.
		timeZone: v.optional(v.string()),

		// === CAPACITY ===
		bedrooms: v.number(),
		bathrooms: v.number(),
		maxGuests: v.number(),
		squareMeters: v.number(),

		// === PRICING (whole euros) ===
		pricePerNight: v.number(),
		discountAmount: v.optional(v.number()), // discounted price per night (e.g. 70 = €70); when > 0 the UI crosses out pricePerNight
		cleaningFee: v.optional(v.number()),
		weekendPremium: v.optional(v.number()), // price per night on Fri-Sat (e.g. 140 = €140)
		monthlyDiscount: v.optional(v.number()),
		weeklyDiscount: v.optional(v.number()),
		currency: v.literal('EUR'),

		// === BOOKING RULES ===
		instantBooking: v.boolean(),
		paymentMethod: v.optional(apartmentPaymentMethod), // what the apartment accepts ('both' = guest chooses); optional for rows created before host payment settings existed
		sameDayReservation: v.boolean(),
		singleDayReservation: v.boolean(), // allows check-in and check-out on same day
		petsAllowed: v.boolean(),
		smokingAllowed: v.boolean(),
		partiesAllowed: v.boolean(),
		minReservationDays: v.number(),
		maxReservationDays: v.optional(v.number()), // undefined = no limit
		checkInTime: v.string(), // "14:00"
		checkOutTime: v.string(), // "10:00"
		quietHoursStart: v.optional(v.string()), // "22:00"
		quietHoursEnd: v.optional(v.string()), // "08:00"

		// === AMENITIES (array of amenity IDs from amenitiesData.ts) ===
		amenities: v.array(v.string()),

		// === MEDIA ===
		images: v.array(apartmentImage), // images[0] is the cover

		// === HOUSE RULES (free text) ===
		houseRules: v.optional(v.string()),

		// === STATUS ===
		status: apartmentStatus,
		isFeatured: v.boolean(), // for homepage/promotional display

		// === MODERATION (stamped by moderateApartmentStatus; absent on unmoderated rows) ===
		moderatedAt: v.optional(v.number()),
		moderatedBy: v.optional(v.string()), // admin's better-auth user id
		moderationReason: v.optional(v.string()), // required for suspensions, shown to the host
		// Machine cause for `status: 'expired'` — stamped by the listing-fee cron only,
		// never by a human (AccommodationsSystemDesign.md §1 A2).
		expiredReason: v.optional(apartmentExpiredReason),

		// === PAYMENT ===
		paidAt: v.optional(v.number()), // timestamp when payment was completed (undefined = unpaid)
		paymentAmount: v.optional(v.number()), // amount paid (in euros)
		paymentOrderId: v.optional(v.string()), // bank OrderID linking payment callback to apartment
		apartmentSubscriptionExpiryDate: v.optional(v.number()), // timestamp when subscription expires (3 months from paidAt)
		/**
		 * When the T−7 "your listing expires soon" email went out for the CURRENT period.
		 * Cleared on every payment, which is what makes the sweep idempotent: a daily cron
		 * that re-reads the same row must not re-send the same reminder
		 * (AccommodationsSystemDesign.md §8/§10).
		 */
		feeReminderSentAt: v.optional(v.number()),

		// === TIMESTAMPS ===
		updatedAt: v.number()
	})
		.index('by_host', ['hostId'])
		// Host dashboard: `.first()` on (host, 'published') resolves the deep-link slug without
		// reading the host's whole portfolio — some hosts own 100+ listings.
		.index('by_host_status', ['hostId', 'status'])
		.index('by_slug', ['slug'])
		.index('by_status', ['status'])
		.index('by_type', ['type'])
		.index('by_price', ['pricePerNight'])
		.index('by_featured', ['isFeatured', 'status'])
		// Compound indexes used by fetchFilteredApartments pagination.
		// by_status_price: lets us eq('status','published') then filter by price range
		// at the DB level before post-fetch filters run — cuts down how many rows
		// the fill-to-page-size loop needs to examine.
		.index('by_status_price', ['status', 'pricePerNight'])
		// by_status_bedrooms: same idea for bedroom count filter
		.index('by_status_bedrooms', ['status', 'bedrooms']),

	/** Marketing newsletter opt-ins. `_creationTime` is the subscribe timestamp. */
	newsletter: defineTable({
		email: v.string()
	}).index('by_email', ['email']),

	/** Public bug/idea/feedback reports from the `/report` form. `_creationTime` is when it landed.
	    `email` is optional — present only when the reporter wants a follow-up. */
	reports: defineTable({
		category: reportCategory,
		message: v.string(),
		email: v.optional(v.string()),
		/**
		 * Admin inbox state (AdminPagesSystemDesign.md §4). Absent = `'new'`, so rows filed
		 * before this field existed needed no migration — every reader normalizes with
		 * `?? 'new'`, including the aggregate's namespace.
		 */
		status: v.optional(reportStatus)
	})
		.index('by_category', ['category'])
		// Inbox reads one status slice at a time. `'new'` needs BOTH this index's `undefined`
		// and `'new'` slices — an index match is exact, and legacy rows stored neither.
		.index('by_status', ['status']),

	bookings: defineTable({
		// === BOOKING CODE ===
		bookingCode: v.string(), // unique 10-character code for guest access (e.g., "BK7X9M2P4Q")

		// === RELATIONSHIPS ===
		// `apartmentId` is the real reference; `apartmentSlug` stays because it is the public
		// identity (URLs, emails) AND the fallback a reservation renders from after a listing
		// is deleted — booking history never cascades (AccommodationsSystemDesign.md §4).
		apartmentId: v.id('apartments'),
		apartmentSlug: v.string(),
		// Better-auth user ids stored as plain strings — there is no `users` table in this
		// deployment (see the schema note at the top). Mirrors `apartments.hostId`.
		hostId: v.string(),
		guestId: v.optional(v.string()), // set when the guest has an account

		// === GUEST INFORMATION ===
		guestFirstName: v.string(),
		guestLastName: v.string(),
		guestEmail: v.string(),
		guestPhone: v.string(),
		specialRequests: v.optional(v.string()),

		// === BOOKING DATES ===
		checkInDate: v.string(), // ISO date: "2025-06-01"
		checkOutDate: v.string(), // ISO date: "2025-06-05"
		numberOfAdults: v.number(),
		numberOfChildren: v.number(),
		numberOfNights: v.number(),

		// === PRICING (snapshot — frozen at creation, invoice-style) ===
		// Listing edits can never reprice an existing booking, which is why listing edits
		// need no locking or versioning (AccommodationsSystemDesign.md §0.3).
		subtotal: v.number(),
		cleaningFee: v.number(),
		/** Platform cut. Always present; 0 unless ACCOMMODATIONS_CONFIG is in `booking_fee` mode. */
		platformFee: v.number(),
		total: v.number(),
		currency: v.literal('EUR'),

		// === PAYMENT ===
		paymentMethod,
		paymentStatus,
		/** Provider hold/charge reference. Absent for cash. */
		paymentRef: v.optional(v.string()),
		/** `awaiting` rows only — the reaper deletes the row past this (PaymentsSystemDesign.md §3). */
		paymentDeadlineAt: v.optional(v.number()),
		/**
		 * Set when a money operation failed; `paymentStatus` is left at its last true value.
		 * Surfaces in `/admin/bookings`' flagged filter and is re-surfaced by the
		 * reconciliation cron until a human clears it (PaymentsSystemDesign.md §4, §6).
		 */
		paymentFlag: v.optional(paymentFlag),

		// === BOOKING STATUS ===
		status: bookingStatus,
		/** The cancellation/response rules this booking was created under — read these, not live config. */
		policy: bookingPolicy,

		// === STAY CONFIRMATION (the provable §4 verification norm — BSD §11) ===
		/** Host asked the guest to confirm the stay is still on. Re-requests overwrite it. */
		stayConfirmationRequestedAt: v.optional(v.number()),
		/** Guest's one-click "yes, I'm coming". Answered = confirmedAt ≥ requestedAt. */
		stayConfirmedAt: v.optional(v.number()),

		// === TIMESTAMPS ===
		updatedAt: v.number(),
		/** Pending requests only — host must respond before this (now + 48h at creation). */
		pendingExpiresAt: v.optional(v.number()),
		cancelledAt: v.optional(v.number()),
		cancelledBy: v.optional(cancelledBy),
		cancelReason: v.optional(v.string()),
		/** True when a guest cancelled inside the free window — the record, since cash can't be charged. */
		lateCancellation: v.optional(v.boolean()),
		archivedAt: v.optional(v.number())
	})
		.index('by_booking_code', ['bookingCode'])
		.index('by_apartment', ['apartmentId'])
		.index('by_host', ['hostId'])
		.index('by_guest_email', ['guestEmail'])
		// Guest-scoped reads. `by_guest` = a user's whole booking list (the "my bookings" page,
		// which shows every status). `by_guest_status_checkin` lets a page pull a single status
		// slice in date order — e.g. confirmed + checkInDate ≥ today, soonest first — so "next
		// trip" / "upcoming" reads only matching rows via .first()/.take() instead of scanning.
		.index('by_guest', ['guestId'])
		.index('by_guest_status_checkin', ['guestId', 'status', 'checkInDate'])
		// Host-scoped twin of `by_guest_status_checkin` — powers the host dashboard: pending
		// action queue (eq host+status), today's check-ins (eq host+status+checkInDate) and the
		// trailing-12-months stats read (eq host+status, range checkInDate) without table scans.
		.index('by_host_status_checkin', ['hostId', 'status', 'checkInDate'])
		.index('by_status', ['status'])
		.index('by_apartment_dates', ['apartmentId', 'checkInDate', 'checkOutDate'])
		// Webhook handlers key on the provider's object ref, never on event sequence, so
		// duplicate and out-of-order deliveries resolve to the same row
		// (PaymentsSystemDesign.md §6).
		.index('by_payment_ref', ['paymentRef']),

	/**
	 * Host-owned calendar blocks — personal use, maintenance, "vacation mode"
	 * (BookingSystemDesign.md §6, HostSystemDesign.md §4).
	 *
	 * Deliberately NOT fake bookings: a fake booking would leak into every booking list,
	 * count, stat, and email. A block has no metadata beyond its range because it answers
	 * exactly one question — is this night free?
	 *
	 * Availability = blocking bookings (`confirmed`, `checked_in`) + these rows. `pending`
	 * blocks nothing.
	 */
	apartmentBlocks: defineTable({
		apartmentId: v.id('apartments'),
		startDate: v.string(), // ISO date "2026-06-01" — same night convention as bookings
		endDate: v.string()
	})
		// Ordered by start date so an overlap read can bound the range instead of scanning
		// a host's whole block history.
		.index('by_apartment', ['apartmentId', 'startDate']),

	/**
	 * One row per captured booking — what the platform holds and owes the host
	 * (PaymentsSystemDesign.md §5). Amounts are immutable once written; only `status` and
	 * the transfer stamps move.
	 */
	bookingEarnings: defineTable({
		bookingId: v.id('bookings'),
		hostId: v.string(),
		/** What the guest paid. */
		gross: v.number(),
		/** From the booking's price snapshot — never recomputed from live fee config. */
		platformFee: v.number(),
		/** `gross - platformFee` — what the host is owed. */
		net: v.number(),
		status: bookingEarningStatus,
		transferRef: v.optional(v.string()),
		transferredAt: v.optional(v.number()),
		/**
		 * Transfer failed (closed bank account, provider rejection). The row STAYS `held`
		 * and the sweep skips it until an admin clears the flag — failures flag, they don't
		 * loop (PaymentsSystemDesign.md §5, §11).
		 */
		payoutFlag: v.optional(paymentFlag)
	})
		.index('by_booking', ['bookingId'])
		// The payout sweep's read: one host's rows in a single status.
		.index('by_host_status', ['hostId', 'status'])
		// Transfer webhooks key on the provider ref, same rule as `bookings.by_payment_ref`.
		.index('by_transfer_ref', ['transferRef']),

	/**
	 * A host's payout account with the payment provider (PaymentsSystemDesign.md §5).
	 *
	 * Created silently when a host first enables online payments on a listing — no forms,
	 * no redirect (§2 stage 2). `transfersActive` is maintained EXCLUSIVELY by provider
	 * account webhooks; never infer it locally. Never read during guest checkout: charging
	 * the guest does not depend on host onboarding state (§0.2).
	 */
	hostPayoutAccounts: defineTable({
		hostId: v.string(),
		providerAccountId: v.string(),
		transfersActive: v.boolean(),
		updatedAt: v.number()
	})
		.index('by_host', ['hostId'])
		.index('by_provider_account', ['providerAccountId'])
});

export default schema;
