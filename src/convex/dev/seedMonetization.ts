// LIBRARIES
import { v } from 'convex/values';
// Trigger-wrapped constructor — seeded listings must move `aggregateApartments` like real
// ones, or every count drifts (GeneralSystemDesignRule.md § table counts).
import { internalMutation } from '@/convex/functions';
import { components } from '@/convex/_generated/api';

// CONFIG
import { ACCOMMODATIONS_CONFIG, MS_PER_DAY } from '@/shared/config';

// UTILS
import { analytics, ANALYTICS_EVENT } from '@/convex/analytics';
import { monthStartUtc } from '@/shared/utils/dateUtils';

// TYPES
import type { Doc } from '@/convex/_generated/dataModel';

/**
 * DEV ONLY — one listing per monetization state, so every surface the per-listing
 * revision added (AccommodationsSystemDesign.md §8) has something real to render:
 * the host's plan column, the admin review queue's payment chip and its publish refusal,
 * the guest-facing service-fee line, and the admin dashboard's PLATFORM revenue.
 *
 * ```sh
 * bunx convex run dev/seedMonetization:seedMonetization "{hostEmail:'you@example.com'}"
 * bunx convex run dev/seedMonetization:clearSeedMonetization
 * ```
 *
 * Requires `ACCOMMODATIONS_CONFIG.MONETIZATION === 'per_listing'` — under `'none'` every
 * fee surface is hidden by design, so the seed would produce rows nobody can see.
 *
 * Seeded listings are marked by their slug prefix ({@link SEED_PLAN_SLUG_PREFIX}); that
 * mark is the ONLY thing `clearSeedMonetization` deletes, so real data is untouchable.
 *
 * ⚠️ Same caveat as `seedMockBookings`: analytics ROLLUPS cannot be deleted through the
 * component, so clearing removes rows, not the revenue history. The events carry
 * `forever`-unique keys, so re-seeding never double-counts.
 *
 * Internal, so no client can call it. Delete this file before real traffic.
 */
const SEED_PLAN_SLUG_PREFIX = 'seed-plan-';

/** Whole euros of platform revenue per trailing month, oldest first — a growing platform. */
const REVENUE_BY_MONTH = [60, 90, 120, 150, 210, 240, 300, 360, 330, 270, 180, 210];

type PlanSpec = {
	slug: string;
	title: string;
	monetization: NonNullable<Doc<'apartments'>['monetization']>;
	status: Doc<'apartments'>['status'];
	paymentMethod: NonNullable<Doc<'apartments'>['paymentMethod']>;
	/** Days from now the paid period ends. `null` = never paid (the publish gate's state). */
	expiresInDays: number | null;
	pricePerNight: number;
	/** What this row exists to demonstrate — echoed in the seed's return value. */
	demonstrates: string;
};

/**
 * The four states worth looking at. Together they cover every branch of
 * `listingFeeState` that has a UI, plus the commission model's one-way door.
 */
const PLAN_SPECS: PlanSpec[] = [
	{
		slug: `${SEED_PLAN_SLUG_PREFIX}paid`,
		title: 'Plan demo — Dorćol (listing fee, paid)',
		monetization: 'listing_fee',
		status: 'published',
		paymentMethod: 'cash',
		expiresInDays: 60,
		pricePerNight: 80,
		demonstrates: 'host row reads "Until <date>", no renew nag; admin queue chip "Paid"'
	},
	{
		slug: `${SEED_PLAN_SLUG_PREFIX}expiring`,
		title: 'Plan demo — Vračar (listing fee, expiring)',
		monetization: 'listing_fee',
		status: 'published',
		paymentMethod: 'cash',
		expiresInDays: 3,
		pricePerNight: 95,
		demonstrates: 'host row reads "Expires in 3 days" + Renew button; the T−7 sweep would email'
	},
	{
		slug: `${SEED_PLAN_SLUG_PREFIX}unpaid`,
		title: 'Plan demo — Zemun (listing fee, never paid)',
		monetization: 'listing_fee',
		status: 'pending_review',
		paymentMethod: 'cash',
		expiresInDays: null,
		pricePerNight: 70,
		demonstrates:
			'admin queue chip "Awaiting payment" + Publish is SERVER-REFUSED (LISTING_FEE_UNPAID); host row offers "Pay now"'
	},
	{
		slug: `${SEED_PLAN_SLUG_PREFIX}commission`,
		title: 'Plan demo — Savamala (per-booking fee)',
		monetization: 'booking_fee',
		status: 'published',
		// Online-only by construction (§8) — the model closes the cash door itself.
		paymentMethod: 'online',
		expiresInDays: null,
		pricePerNight: 110,
		demonstrates:
			'host row reads "permanent · new listing to change plan" (no action); guest quote carries the service-fee line'
	}
];

function planApartmentDoc(
	spec: PlanSpec,
	hostId: string,
	now: number
): Omit<Doc<'apartments'>, '_id' | '_creationTime'> {
	return {
		hostId,
		title: spec.title,
		slug: spec.slug,
		description:
			'Mock listing created by the dev monetization seed so the per-listing plan surfaces have something to render.',
		type: 'apartment',
		address: 'Cara Dušana',
		addressNumber: '25',
		city: 'Beograd',
		country: 'Serbia',
		bedrooms: 2,
		bathrooms: 1,
		maxGuests: 4,
		squareMeters: 62,
		pricePerNight: spec.pricePerNight,
		cleaningFee: 20,
		currency: 'EUR',
		instantBooking: false,
		paymentMethod: spec.paymentMethod,
		sameDayReservation: false,
		singleDayReservation: false,
		petsAllowed: false,
		smokingAllowed: false,
		partiesAllowed: false,
		minReservationDays: 1,
		checkInTime: '14:00',
		checkOutTime: '10:00',
		amenities: ['wifi', 'kitchen', 'washer', 'air_conditioning', 'tv'],
		images: [
			{
				key: `seed/${spec.slug}.jpg`,
				url: `https://picsum.photos/seed/${spec.slug}/800/600`,
				alt: spec.title,
				order: 0
			}
		],

		monetization: spec.monetization,
		// A paid period stamps `paidAt` too — the unpaid row deliberately stamps neither,
		// which is exactly what `listingFeeState` reads as `unpaid` (the publish gate).
		...(spec.expiresInDays === null
			? {}
			: {
					paidAt: now,
					paymentAmount: ACCOMMODATIONS_CONFIG.LISTING_FEE.AMOUNT,
					paymentOrderId: `seed-${spec.slug}`,
					apartmentSubscriptionExpiryDate: now + spec.expiresInDays * MS_PER_DAY
				}),

		status: spec.status,
		isFeatured: false,
		updatedAt: now
	};
}

export const seedMonetization = internalMutation({
	args: {
		/** Seed against this account — the email you sign in with. */
		hostEmail: v.string()
	},
	returns: v.object({
		listings: v.array(v.object({ slug: v.string(), demonstrates: v.string() })),
		revenueMonths: v.number(),
		hostId: v.string()
	}),
	handler: async (ctx, args) => {
		if (ACCOMMODATIONS_CONFIG.MONETIZATION !== 'per_listing') {
			throw new Error(
				"[seedMonetization] ACCOMMODATIONS_CONFIG.MONETIZATION is 'none' — every fee surface is hidden, so the seed would render nothing. Flip it to 'per_listing' (after backfillListingMonetization) and redeploy."
			);
		}

		const hostId = (
			(await ctx.runQuery(components.betterAuth.userQueries.listUsersPaginated, {
				paginationOpts: { numItems: 5, cursor: null },
				search: args.hostEmail.trim().toLowerCase(),
				searchField: 'email' as const
			})) as { page: { _id: string; email: string }[] }
		).page[0]?._id;

		if (!hostId) throw new Error(`[seedMonetization] No account found for "${args.hostEmail}".`);

		const now = Date.now();

		// Rows are not idempotent — re-seeding on top would duplicate every listing.
		for (const spec of PLAN_SPECS) {
			const existing = await ctx.db
				.query('apartments')
				.withIndex('by_slug', (q) => q.eq('slug', spec.slug))
				.first();
			if (existing) {
				throw new Error(
					'[seedMonetization] Seed listings already exist — run clearSeedMonetization first.'
				);
			}
		}

		for (const spec of PLAN_SPECS) {
			await ctx.db.insert('apartments', planApartmentDoc(spec, hostId, now));
		}

		// --- platform revenue the admin dashboard reads (ASD §8 "platform-revenue events") ---
		// GLOBAL scope (no `scopes`) — this is the platform's money, not a host's. Split across
		// both streams so the `plan` dimension has something to separate. Whole euros → cents.
		for (let monthsBack = 11; monthsBack >= 0; monthsBack--) {
			const occurredAt = monthStartUtc(now, monthsBack) + MS_PER_DAY;
			const euros = REVENUE_BY_MONTH[11 - monthsBack];
			// Two thirds listing fees, one third commission — a cash-dominant platform where
			// online is only starting to matter.
			const listingFeeEuros = Math.round((euros * 2) / 3);
			const bookingFeeEuros = euros - listingFeeEuros;

			for (const [plan, amount] of [
				['listing_fee', listingFeeEuros],
				['booking_fee', bookingFeeEuros]
			] as const) {
				await analytics.track(ctx, ANALYTICS_EVENT.INVOICE_PAID, {
					occurredAt,
					properties: { amountCents: amount * 100, currency: 'EUR', plan },
					unique: { key: `seed:rev:${plan}:${monthsBack}`, scope: 'forever' }
				});
			}
		}

		return {
			listings: PLAN_SPECS.map((s) => ({ slug: s.slug, demonstrates: s.demonstrates })),
			revenueMonths: REVENUE_BY_MONTH.length,
			hostId
		};
	}
});

/** Deletes exactly what {@link seedMonetization} wrote — matched on the slug prefix. */
export const clearSeedMonetization = internalMutation({
	args: {},
	returns: v.object({ apartments: v.number() }),
	handler: async (ctx) => {
		let apartments = 0;

		for (const spec of PLAN_SPECS) {
			const row = await ctx.db
				.query('apartments')
				.withIndex('by_slug', (q) => q.eq('slug', spec.slug))
				.first();
			if (!row) continue;

			// A seeded listing can have picked up bookings while you clicked around; those
			// reference it, so clear them with `clearMockBookings` (or by hand) first.
			const booking = await ctx.db
				.query('bookings')
				.withIndex('by_apartment_dates', (q) => q.eq('apartmentId', row._id))
				.first();
			if (booking) {
				throw new Error(
					`[clearSeedMonetization] "${spec.slug}" has bookings — clear those first (dev/seedMockBookings:clearMockBookings).`
				);
			}

			await ctx.db.delete(row._id);
			apartments += 1;
		}

		return { apartments };
	}
});
