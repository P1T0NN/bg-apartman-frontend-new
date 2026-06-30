// LIBRARIES
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

// TABLES
import { auditLogTable } from './tables/auditLog/schemas/auditLogSchema';

// SCHEMAS
import {
	apartmentType,
	apartmentStatus,
	paymentMethod,
	coordinates,
	apartmentImage
} from './tables/accommodations/schemas/accommodationsSchemas';
import { bookingStatus, paymentStatus } from './tables/bookings/schemas/bookingsSchemas';

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
		// The listing's city + country Google place ids, space-joined into one string (e.g.
		// "<cityId> <countryId>"). Resolved via Places Autocomplete at save — the same source the
		// search box uses — so the ids are identical and language-independent ("Beograd" and
		// "Belgrade" share a place id). Search matches when the picked place id is one of the parts,
		// so a listing surfaces for a city search AND a country search.
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
		paymentMethod: v.optional(paymentMethod), // optional for rows created before host payment settings existed
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
		images: v.array(apartmentImage),
		coverImageIndex: v.optional(v.number()), // index of cover image in images array

		// === HOUSE RULES (free text) ===
		houseRules: v.optional(v.string()),

		// === STATUS ===
		status: apartmentStatus,
		isFeatured: v.boolean(), // for homepage/promotional display

		// === PAYMENT ===
		paidAt: v.optional(v.number()), // timestamp when payment was completed (undefined = unpaid)
		paymentAmount: v.optional(v.number()), // amount paid (in euros)
		paymentOrderId: v.optional(v.string()), // bank OrderID linking payment callback to apartment
		apartmentSubscriptionExpiryDate: v.optional(v.number()), // timestamp when subscription expires (3 months from paidAt)

		// === TIMESTAMPS ===
		updatedAt: v.number()
	})
		.index('by_host', ['hostId'])
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

	bookings: defineTable({
		// === BOOKING CODE ===
		bookingCode: v.string(), // unique 10-character code for guest access (e.g., "BK7X9M2P4Q")

		// === RELATIONSHIPS ===
		// `apartmentId` points at the real apartment row once listings are persisted; it's
		// omitted during the current dummy-data phase (no apartments are stored yet), so
		// `apartmentSlug` carries the listing reference the reservation page resolves + links.
		apartmentId: v.optional(v.id('apartments')),
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

		// === PRICING ===
		subtotal: v.number(),
		cleaningFee: v.number(),
		total: v.number(),
		currency: v.literal('EUR'),

		// === PAYMENT ===
		paymentMethod,
		paymentStatus,

		// === BOOKING STATUS ===
		status: bookingStatus,

		// === TIMESTAMPS ===
		updatedAt: v.number(),
		/** Pending requests only — host must respond before this (now + 48h at creation). */
		pendingExpiresAt: v.optional(v.number()),
		cancelledAt: v.optional(v.number()),
		cancelledBy: v.optional(v.union(v.literal('guest'), v.literal('host'), v.literal('system'))),
		cancelReason: v.optional(v.string()),
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
		.index('by_status', ['status'])
		.index('by_apartment_dates', ['apartmentId', 'checkInDate', 'checkOutDate'])
});

export default schema;
