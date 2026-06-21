// LIBRARIES
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

// TABLES
import { auditLogTable } from './tables/auditLog/schemas/auditLogSchema';

// SCHEMAS
import {
	apartmentType,
	apartmentStatus,
	coordinates,
	apartmentImage
} from './tables/accommodations/schemas/accommodationsSchemas';

const schema = defineSchema({
	// Users (with `role` and other custom fields) live in the better-auth component;
	// access via `authComponent.getAuthUser(ctx)`. Foreign-key columns below store the
	// better-auth user id as a plain string.

	// Audit logs — toggle population via FEATURES.AUDIT_LOGS in projectSettings.ts.
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

		// === BASIC INFO ===
		title: v.string(),
		slug: v.string(), // URL-friendly identifier
		description: v.string(),
		type: apartmentType,

		// === LOCATION ===
		address: v.string(),
		city: v.string(),
		country: v.optional(v.string()),
		cityPlaceId: v.optional(v.string()),
		coordinates: v.optional(coordinates),

		// === CAPACITY ===
		bedrooms: v.number(),
		// Deprecated legacy field. New writes omit this; keep optional until old
		// apartment documents are migrated to remove stored `beds` values.
		beds: v.optional(v.number()),
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
		updatedAt: v.number(),
		publishedAt: v.optional(v.number())
	})
		.index('by_host', ['hostId'])
		.index('by_slug', ['slug'])
		.index('by_city', ['city'])
		.index('by_status', ['status'])
		.index('by_type', ['type'])
		.index('by_price', ['pricePerNight'])
		.index('by_featured', ['isFeatured', 'status'])
		.index('by_payment_order_id', ['paymentOrderId'])
		// Compound indexes used by fetchFilteredApartments pagination.
		// by_status_price: lets us eq('status','published') then filter by price range
		// at the DB level before post-fetch filters run — cuts down how many rows
		// the fill-to-page-size loop needs to examine.
		.index('by_status_price', ['status', 'pricePerNight'])
		// by_status_bedrooms: same idea for bedroom count filter
		.index('by_status_bedrooms', ['status', 'bedrooms'])
		// by_status_cityPlaceId: filter by city at DB level when cityPlaceId is provided
		.index('by_status_cityPlaceId', ['status', 'cityPlaceId']),

	bookings: defineTable({
		// === BOOKING CODE ===
		bookingCode: v.string(), // unique 10-character code for guest access (e.g., "BK7X9M2P4Q")

		// === RELATIONSHIPS ===
		apartmentId: v.id('apartments'),
		hostId: v.id('users'),
		guestId: v.optional(v.id('users')), // if guest has an account

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
		// DEPRECATED — kept optional so existing documents pass schema validation
		pricePerNight: v.optional(v.number()),

		// === PAYMENT ===
		paymentMethod: v.union(v.literal('cash')), // extend later: v.literal('card'), etc.
		paymentStatus: v.union(
			v.literal('pending'),
			v.literal('paid'),
			v.literal('refunded')
		),

		// === BOOKING STATUS ===
		status: v.union(
			v.literal('pending'),
			v.literal('confirmed'),
			v.literal('checked_in'),
			v.literal('checked_out'),
			v.literal('cancelled')
		),

		// === TIMESTAMPS ===
		updatedAt: v.number(),
		cancelledAt: v.optional(v.number()),
		cancelledBy: v.optional(v.union(v.literal('guest'), v.literal('host'))),
		cancelReason: v.optional(v.string()),
		archivedAt: v.optional(v.number())
	})
		.index('by_booking_code', ['bookingCode'])
		.index('by_apartment', ['apartmentId'])
		.index('by_host', ['hostId'])
		.index('by_guest', ['guestId'])
		.index('by_guest_email', ['guestEmail'])
		.index('by_status', ['status'])
		.index('by_payment_status', ['paymentStatus'])
		.index('by_apartment_dates', ['apartmentId', 'checkInDate', 'checkOutDate']),
});

export default schema;
