// LIBRARIES
import { v } from 'convex/values';
// Trigger-wrapped constructors — seeded rows must move the booking/apartment aggregates like
// real ones, or every count on the dashboard drifts (GeneralSystemDesignRule.md § table counts).
import { internalMutation } from '@/convex/functions';
import { components } from '@/convex/_generated/api';

// UTILS
import { analytics, ANALYTICS_EVENT, hostAnalyticsScope } from '@/convex/analytics';
import { calculatePrice } from '@/shared/features/pricing/utils/calculatePrice';
import { makeBookingCode } from '@/shared/features/booking/utils/makeBookingCode';
import { currentBookingPolicySnapshot } from '@/shared/features/booking/utils/currentBookingPolicySnapshot';
import { nightsByMonth } from '@/shared/features/booking/utils/nightsByMonth';
import { nightsBetween, monthStartUtc } from '@/shared/utils/dateUtils';

// TYPES
import type { MutationCtx } from '@/convex/_generated/server';
import type { Doc } from '@/convex/_generated/dataModel';

/**
 * DEV ONLY — the ONE dummy-data source, simulating production end to end: a year of
 * checked-out historical stays plus a live queue across every state, with the SAME
 * analytics events the real mutations would have emitted. Chart (rollups) and tables
 * (rows) therefore describe the same world — no dev-only mismatches.
 *
 * ```sh
 * # seeds against your own account; creates a mock listing if you own none yet
 * bunx convex run dev/seedMockBookings:seedMockBookings '{"hostEmail":"you@example.com"}'
 * bunx convex run dev/seedMockBookings:clearMockBookings           # removes the rows again
 * ```
 *
 * Seeded rows are marked — bookings by their guest email domain ({@link SEED_EMAIL_DOMAIN}),
 * the mock listing by its slug ({@link SEED_APARTMENT_SLUG}). Those marks are the ONLY thing
 * `clearMockBookings` deletes, so it can never touch real data. The seed refuses to run on
 * top of existing seed rows (events are idempotent, rows are not — re-running would double
 * the tables but not the chart).
 *
 * Events: every earning-status row (confirmed / checked_in / checked_out) emits
 * `booking.confirmed` + its `booking.nights_booked` split, HOST-scoped, with `occurredAt`
 * dated to the CHECK-IN date — the same date the per-accommodation table attributes revenue
 * to, which is what keeps every window's chart total and table total in agreement. Rows
 * seeded in ended states (declined/withdrawn/cancelled) emit nothing: their money story
 * would need paired confirm+cancel events in different buckets, which reads as phantom
 * noise in short windows.
 *
 * ⚠️ Rollups cannot be deleted through the component: `clearMockBookings` removes ROWS
 * only. For a truly pristine reset, wipe the analytics component's data tables in the
 * Convex dashboard (Data → component `analytics` → clear `analyticsEvents`,
 * `analyticsDailyMetrics`, `analyticsUniqueEvents`, `analyticsDailyActorClaims`) and then
 * reseed. Leave `analyticsConfigurations`, or re-run `bun run analytics:configure`.
 *
 * Internal, so no client can call any of these. Delete this file before real traffic.
 */
const SEED_EMAIL_DOMAIN = '@seed.example.com';
const SEED_APARTMENT_SLUG = 'seed-mock-apartment';

const MS_PER_HOUR = 3_600_000;
const MS_PER_DAY = 86_400_000;

/** Rows the trend chart is built from: bookings per trailing month, oldest first — a
 *  Belgrade short-let year (quiet winter, spring build-up, August peak, autumn taper). */
const HISTORY_BOOKINGS_PER_MONTH = [4, 5, 7, 9, 11, 13, 15, 17, 14, 10, 6, 8];

/** Cycled for historical guests; paired first/last so names look plausible, not generated. */
const HISTORY_GUESTS = [
	['Milan', 'Popović'],
	['Sara', 'Đukić'],
	['Petar', 'Lazić'],
	['Mina', 'Živković'],
	['Lazar', 'Obradović'],
	['Anja', 'Simić'],
	['Uroš', 'Blagojević'],
	['Iva', 'Radovanović'],
	['Pavle', 'Milošević'],
	['Dunja', 'Stojanović']
] as const;

/** ISO date `n` days from today (negative = past). */
function isoDay(offset: number, now: number): string {
	return new Date(now + offset * MS_PER_DAY).toISOString().slice(0, 10);
}

/**
 * The rollup events production would have emitted for one earning booking, host-scoped.
 * `occurredAt` is the check-in date (UTC midnight — the exact day bucket), matching how the
 * per-accommodation table attributes revenue, so chart and table always agree per window.
 * Unique keys are derived from stable facts (not `_id`), so re-emitting is a no-op.
 */
async function emitEarningEvents(
	ctx: MutationCtx,
	booking: {
		hostId: string;
		guestEmail: string;
		checkInDate: string;
		checkOutDate: string;
		total: number;
		paymentMethod: Doc<'bookings'>['paymentMethod'];
	}
): Promise<void> {
	const scopes = [hostAnalyticsScope(booking.hostId)];
	const idKey = `${booking.guestEmail}:${booking.checkInDate}`;
	const occurredAt = Date.parse(`${booking.checkInDate}T00:00:00Z`);

	await analytics.track(ctx, ANALYTICS_EVENT.BOOKING_CONFIRMED, {
		occurredAt,
		scopes,
		properties: { totalEuros: booking.total, paymentMethod: booking.paymentMethod },
		unique: { key: `seed:bk:confirmed:${idKey}`, scope: 'forever' }
	});

	for (const { monthStartMs, nights } of nightsByMonth(booking.checkInDate, booking.checkOutDate)) {
		await analytics.track(ctx, ANALYTICS_EVENT.BOOKING_NIGHTS_BOOKED, {
			occurredAt: monthStartMs,
			scopes,
			properties: { nights },
			unique: { key: `seed:bk:nights:${idKey}:${monthStartMs}`, scope: 'forever' }
		});
	}
}

type SeedSpec = {
	first: string;
	last: string;
	/** Check-in offset in days from today. */
	from: number;
	nights: number;
	status: Doc<'bookings'>['status'];
	paymentMethod: Doc<'bookings'>['paymentMethod'];
	paymentStatus: Doc<'bookings'>['paymentStatus'];
	/** `pending` rows only — hours until the host's clock runs out. */
	expiresInHours?: number;
	cancelledBy?: Doc<'bookings'>['cancelledBy'];
	cancelReason?: string;
	specialRequests?: string;
};

/**
 * One row per state the host surfaces must render (BookingSystemDesign.md §2). The three
 * `pending` rows carry deliberately shuffled deadlines: the queue's default sort is
 * deadline-ascending, so Nikola (3h) must land above Ivana (20h) above Marko (44h) even
 * though they were created in the opposite order.
 */
const SEED_SPECS: SeedSpec[] = [
	// --- pending: the actionable slice, out-of-order deadlines on purpose ---
	{
		first: 'Marko',
		last: 'Jovanović',
		from: 12,
		nights: 3,
		status: 'pending',
		paymentMethod: 'cash',
		paymentStatus: 'on_arrival',
		expiresInHours: 44
	},
	{
		first: 'Ivana',
		last: 'Petrović',
		from: 30,
		nights: 5,
		status: 'pending',
		paymentMethod: 'cash',
		paymentStatus: 'on_arrival',
		expiresInHours: 20,
		specialRequests: 'Arriving late, around 23:00 — is that alright?'
	},
	{
		first: 'Nikola',
		last: 'Stanković',
		from: 20,
		nights: 2,
		status: 'pending',
		paymentMethod: 'cash',
		paymentStatus: 'on_arrival',
		expiresInHours: 3
	},

	// --- confirmed: these are the nights the calendar paints as booked ---
	{
		first: 'Ana',
		last: 'Marković',
		from: 5,
		nights: 4,
		status: 'confirmed',
		paymentMethod: 'cash',
		paymentStatus: 'on_arrival'
	},
	{
		first: 'Luka',
		last: 'Ilić',
		from: 25,
		nights: 3,
		status: 'confirmed',
		// Online is dark until the payments adapter ships (PaymentsSystemDesign.md §8); this row
		// exists only so the Payment column has something other than cash to render.
		paymentMethod: 'online',
		paymentStatus: 'authorized'
	},

	// --- in progress / past ---
	{
		first: 'Jelena',
		last: 'Kostić',
		from: -1,
		nights: 4,
		status: 'checked_in',
		paymentMethod: 'cash',
		paymentStatus: 'on_arrival'
	},
	{
		first: 'Stefan',
		last: 'Nikolić',
		from: -20,
		nights: 3,
		status: 'checked_out',
		paymentMethod: 'cash',
		paymentStatus: 'on_arrival'
	},

	// --- the four ways a booking ends without a stay ---
	{
		first: 'Milica',
		last: 'Ristić',
		from: 14,
		nights: 2,
		status: 'withdrawn',
		paymentMethod: 'cash',
		paymentStatus: 'on_arrival',
		cancelledBy: 'guest',
		cancelReason: 'Withdrawn by guest.'
	},
	{
		first: 'Vuk',
		last: 'Đorđević',
		from: -5,
		nights: 2,
		status: 'auto_declined',
		paymentMethod: 'cash',
		paymentStatus: 'on_arrival',
		cancelledBy: 'system',
		cancelReason: 'The host did not respond in time.'
	},
	{
		first: 'Teodora',
		last: 'Pavlović',
		from: -8,
		nights: 6,
		status: 'declined',
		paymentMethod: 'cash',
		paymentStatus: 'on_arrival',
		cancelledBy: 'host',
		cancelReason: "Sorry — I'm renovating the bathroom that week."
	},
	{
		first: 'Filip',
		last: 'Todorović',
		from: 40,
		nights: 3,
		status: 'cancelled',
		paymentMethod: 'cash',
		paymentStatus: 'on_arrival',
		cancelledBy: 'guest',
		cancelReason: 'Cancelled by guest.'
	}
];

/** The listing the seeded bookings hang off, when the host owns none yet. */
function seedApartmentDoc(hostId: string) {
	return {
		hostId,
		title: 'Seed Apartment — Dorćol',
		slug: SEED_APARTMENT_SLUG,
		description:
			'Mock listing created by the dev seed so the host surfaces have something to render.',
		type: 'apartment' as const,
		address: 'Cara Dušana',
		addressNumber: '25',
		city: 'Beograd',
		country: 'Serbia',
		bedrooms: 2,
		bathrooms: 1,
		maxGuests: 4,
		squareMeters: 62,
		pricePerNight: 80,
		cleaningFee: 20,
		currency: 'EUR' as const,
		instantBooking: false,
		paymentMethod: 'cash' as const,
		sameDayReservation: false,
		singleDayReservation: false,
		petsAllowed: false,
		smokingAllowed: false,
		partiesAllowed: false,
		minReservationDays: 1,
		checkInTime: '14:00',
		checkOutTime: '10:00',
		amenities: ['wifi', 'kitchen', 'washer', 'air_conditioning', 'tv'],
		// A real URL, not `[]`: the booking sheet renders `apartment.imageUrl` unconditionally,
		// and an empty src re-requests the page.
		images: [
			{
				key: 'seed/apartment.jpg',
				url: 'https://picsum.photos/seed/bgapartman/800/600',
				alt: 'Seed apartment',
				order: 0
			}
		],
		status: 'published' as const,
		isFeatured: false,
		updatedAt: Date.now()
	};
}

export const seedMockBookings = internalMutation({
	args: {
		/** Seed against this account's listings — the email you sign in with. */
		hostEmail: v.optional(v.string()),
		apartmentSlug: v.optional(v.string())
	},
	returns: v.object({
		created: v.number(),
		historical: v.number(),
		apartmentTitle: v.string(),
		apartmentSlug: v.string(),
		hostId: v.string()
	}),
	handler: async (ctx, args) => {
		// The BA user table lives inside the auth component, so an email lookup goes through
		// the component's own query (see auth/component/userQueries.ts).
		const hostId = args.hostEmail
			? (
					(await ctx.runQuery(components.betterAuth.userQueries.listUsersPaginated, {
						paginationOpts: { numItems: 5, cursor: null },
						search: args.hostEmail.trim().toLowerCase(),
						searchField: 'email' as const
					})) as { page: { _id: string; email: string }[] }
				).page[0]?._id
			: undefined;

		if (args.hostEmail && !hostId) {
			throw new Error(`[seedMockBookings] No account found for "${args.hostEmail}".`);
		}

		let apartment = args.apartmentSlug
			? await ctx.db
					.query('apartments')
					.withIndex('by_slug', (q) => q.eq('slug', args.apartmentSlug!))
					.first()
			: hostId
				? await ctx.db
						.query('apartments')
						.withIndex('by_host', (q) => q.eq('hostId', hostId))
						.first()
				: await ctx.db.query('apartments').first();

		if (!apartment && hostId) {
			const seededId = await ctx.db.insert('apartments', seedApartmentDoc(hostId));
			apartment = await ctx.db.get(seededId);
		}

		if (!apartment) {
			throw new Error(
				'[seedMockBookings] No apartment to seed against — pass {"hostEmail":"you@example.com"} and one will be created.'
			);
		}

		// Rows are NOT idempotent (events are): re-running would double every table while the
		// unique-keyed events no-op, and the chart would silently disagree with the tables.
		const existingSeedRow = (await ctx.db.query('bookings').collect()).find((b) =>
			b.guestEmail.endsWith(SEED_EMAIL_DOMAIN)
		);
		if (existingSeedRow) {
			throw new Error('[seedMockBookings] Seed rows already exist — run clearMockBookings first.');
		}

		const now = Date.now();
		const todayIso = new Date(now).toISOString().slice(0, 10);
		const policy = currentBookingPolicySnapshot();
		const EARNING = new Set(['confirmed', 'checked_in', 'checked_out']);

		// --- the live queue: one row per state the host surfaces must render ---
		for (const spec of SEED_SPECS) {
			const checkInDate = isoDay(spec.from, now);
			const checkOutDate = isoDay(spec.from + spec.nights, now);
			const quote = calculatePrice(apartment, nightsBetween(checkInDate, checkOutDate));
			const ended = spec.cancelledBy !== undefined;
			const guestEmail = `${spec.first.toLowerCase()}${SEED_EMAIL_DOMAIN}`;

			await ctx.db.insert('bookings', {
				bookingCode: makeBookingCode(),
				apartmentId: apartment._id,
				apartmentSlug: apartment.slug,
				hostId: apartment.hostId,

				guestFirstName: spec.first,
				guestLastName: spec.last,
				guestEmail,
				guestPhone: '+381 60 123 4567',
				specialRequests: spec.specialRequests,

				checkInDate,
				checkOutDate,
				numberOfAdults: 2,
				numberOfChildren: spec.nights > 3 ? 1 : 0,
				numberOfNights: spec.nights,

				subtotal: quote.accommodationTotal,
				cleaningFee: quote.cleaningFee,
				platformFee: quote.platformFee,
				total: quote.total,
				currency: 'EUR',

				paymentMethod: spec.paymentMethod,
				paymentStatus: spec.paymentStatus,

				status: spec.status,
				policy,
				pendingExpiresAt:
					spec.expiresInHours === undefined ? undefined : now + spec.expiresInHours * MS_PER_HOUR,

				updatedAt: now,
				cancelledAt: ended ? now - MS_PER_DAY : undefined,
				cancelledBy: spec.cancelledBy,
				cancelReason: spec.cancelReason
			});

			if (EARNING.has(spec.status)) {
				await emitEarningEvents(ctx, {
					hostId: apartment.hostId,
					guestEmail,
					checkInDate,
					checkOutDate,
					total: quote.total,
					paymentMethod: spec.paymentMethod
				});
			}
		}

		// --- a year of checked-out history: the rows the trend chart is made of ---
		let historical = 0;
		for (let monthsBack = 11; monthsBack >= 0; monthsBack--) {
			const monthStartMs = monthStartUtc(now, monthsBack);
			const count = HISTORY_BOOKINGS_PER_MONTH[11 - monthsBack];

			for (let j = 0; j < count; j++) {
				// Spread through the month; 2–4 nights so months differ in revenue, not just count.
				const checkInMs = monthStartMs + Math.floor((j * 26) / count + 1) * MS_PER_DAY;
				const nights = 2 + ((j + monthsBack) % 3);
				const checkInDate = new Date(checkInMs).toISOString().slice(0, 10);
				const checkOutDate = new Date(checkInMs + nights * MS_PER_DAY).toISOString().slice(0, 10);

				// `checked_out` must be in the past — the current month's tail would produce
				// stays that haven't ended, so those slots simply don't exist yet.
				if (checkOutDate >= todayIso) continue;

				const [first, last] = HISTORY_GUESTS[(j + monthsBack) % HISTORY_GUESTS.length];
				const guestEmail = `${first.toLowerCase()}.${monthsBack}.${j}${SEED_EMAIL_DOMAIN}`;
				const quote = calculatePrice(apartment, nights);

				await ctx.db.insert('bookings', {
					bookingCode: makeBookingCode(),
					apartmentId: apartment._id,
					apartmentSlug: apartment.slug,
					hostId: apartment.hostId,

					guestFirstName: first,
					guestLastName: last,
					guestEmail,
					guestPhone: '+381 60 123 4567',

					checkInDate,
					checkOutDate,
					numberOfAdults: 2,
					numberOfChildren: nights > 3 ? 1 : 0,
					numberOfNights: nights,

					subtotal: quote.accommodationTotal,
					cleaningFee: quote.cleaningFee,
					platformFee: quote.platformFee,
					total: quote.total,
					currency: 'EUR',

					paymentMethod: 'cash',
					paymentStatus: 'on_arrival',

					status: 'checked_out',
					policy,
					updatedAt: checkInMs + nights * MS_PER_DAY
				});

				await emitEarningEvents(ctx, {
					hostId: apartment.hostId,
					guestEmail,
					checkInDate,
					checkOutDate,
					total: quote.total,
					paymentMethod: 'cash'
				});
				historical += 1;
			}
		}

		return {
			created: SEED_SPECS.length,
			historical,
			apartmentTitle: apartment.title,
			apartmentSlug: apartment.slug,
			hostId: apartment.hostId
		};
	}
});

/** Deletes exactly what {@link seedMockBookings} wrote — matched on the two seed marks. */
export const clearMockBookings = internalMutation({
	args: {},
	returns: v.object({ bookings: v.number(), apartments: v.number() }),
	handler: async (ctx) => {
		const rows = await ctx.db.query('bookings').collect();
		let bookings = 0;

		for (const booking of rows) {
			if (!booking.guestEmail.endsWith(SEED_EMAIL_DOMAIN)) continue;
			await ctx.db.delete(booking._id);
			bookings += 1;
		}

		// Only the generated mock listing — a real listing the seed borrowed stays put.
		const seedApartment = await ctx.db
			.query('apartments')
			.withIndex('by_slug', (q) => q.eq('slug', SEED_APARTMENT_SLUG))
			.first();
		if (seedApartment) await ctx.db.delete(seedApartment._id);

		return { bookings, apartments: seedApartment ? 1 : 0 };
	}
});
