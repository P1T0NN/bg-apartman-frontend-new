/** Branding and contact strings used by emails, headers, footers, etc. */
export const COMPANY_DATA = {
	NAME: 'BGApartman',
	EMAIL: 'company@gmail.com',
	RESEND_EMAIL: 'onboarding@resend.dev', // default email for the Resend provider
	DOMAIN: 'bgapartman.com',
	LOGO: '/logo/opt/logo-1536w.webp',
	DESCRIPTION:
		'We build dependable software and services so your team can focus on what matters most.',
	// Social profiles shown in the footer — replace '#' with the real URLs.
	INSTAGRAM_URL: 'https://www.instagram.com/bgapartman/',
	FACEBOOK_URL: 'https://www.facebook.com/profile.php?id=61557036657114',
	TIKTOK_URL: 'https://www.tiktok.com/@bgapartman/',
	YOUTUBE_URL: 'https://www.youtube.com/@BgapartmanDubai'
} as const;

/**
 * Fallback IANA zone for a accommodation's availability calendar — used only when a accommodation
 * has no stored `timeZone` (rows created before timezone resolution existed, or a
 * failed lookup). Each accommodation now resolves its own zone from the address pin
 * (coordinates → IANA via `tz-lookup`; see `PlaceDetails.timeZone`), so the calendar
 * runs in the apartment's local day, not the viewer's. Belgrade because the accommodations
 * to date are Serbian.
 */
export const DEFAULT_TIME_ZONE = 'Europe/Belgrade';

export const PAGINATION_DATA = {
	DEFAULT_PAGE_SIZE: 10,
	/** Server-side cap for `paginationOpts.numItems` (e.g. search dropdowns). */
	MAX_PAGE_SIZE: 25,
	/** Page size for infinite scroll. */
	INFINITE_SCROLL_PAGE_SIZE: 12,
	/** Default for `DataTable` `optimizationStrategy` (see `DataTableOptimizationStrategy` in data-table `types.ts`). */
	DEFAULT_OPTIMIZATION_STRATEGY: 'cursor' as const
};

export const LOCAL_STORAGE_KEYS = {
	GUEST_FAVORITES: 'bg-apartman:guest-favorites'
} as const;

/**
 * Routes instrumented by `initBotId` on the client and verified by
 * `checkBotId` on the server via `safeCommand`.
 *
 * SvelteKit remote functions POST to `/_app/remote/<hash>/call`. The prefixed
 * variant is kept in case a path segment is ever added ahead of `_app`.
 */
export const BOTID_PROTECTED_ROUTES = [
	{ path: '/_app/remote/*', method: 'POST' as const },
	{ path: '/*/_app/remote/*', method: 'POST' as const }
];

/**
 * Runtime feature flags. Toggle subsystems on/off in one place.
 * Evaluated in Convex functions and on the client.
 */
export const FEATURES = {
	/**
	 * Enable audit logging. When `false`, `ctx.audit()` / `logAudit()` are no-ops
	 * and nothing is written to the `auditLogs` table.
	 *
	 * The table itself is always declared in the schema so toggling this flag
	 * does not require a schema migration.
	 */
	AUDIT_LOGS: true,

	/**
	 * Use Cloudflare R2 (`@convex-dev/r2`) for file uploads instead of Convex storage.
	 * - `true`  → uploads go to R2, reads/deletes target the `uploadedFilesR2` table.
	 * - `false` → uploads go to Convex storage, reads/deletes target `uploadedFiles`.
	 * Both backends stay registered server-side; this only switches which one the UI uses.
	 */
	USE_R2: true
} as const;

/**
 * Listings configuration — including how the platform earns
 * (AccommodationsSystemDesign.md §8). Exactly one monetization mode is active; switching
 * is a deploy, never a per-row decision. Every mode's schema hooks exist permanently, so
 * flipping the switch changes behavior, never structure.
 *
 * Reads MUST branch on `MONETIZATION`, never on field presence — legacy rows carry
 * payment stamps even in `'none'` mode.
 */
export const ACCOMMODATIONS_CONFIG = {
	/**
	 * Whether monetization exists at all. `'per_listing'` = each listing carries its
	 * host-chosen model (`apartments.monetization`: listing fee vs per-booking fee —
	 * AccommodationsSystemDesign.md §8). Flipping to `'per_listing'` requires the
	 * `backfillListingMonetization` run FIRST (§8 switch honesty).
	 */
	MONETIZATION: 'per_listing' as 'none' | 'per_listing',

	LISTING_FEE: {
		/** Whole euros per period per listing. */
		AMOUNT: 30,
		/** Days a payment buys. 90 ≈ the legacy 3-month subscription. */
		PERIOD_DAYS: 90,
		/** Days past expiry before the cron flips published → expired. */
		GRACE_DAYS: 3,
		/** Days before expiry the reminder email goes out. */
		REMINDER_DAYS_BEFORE: 7
	},

	BOOKING_FEE: {
		/**
		 * Percent of the booking subtotal, rounded to whole euros. This is the platform's
		 * GROSS margin — payment-provider processing costs come out of it, so set it with
		 * those rates in view (PaymentsSystemDesign.md §8).
		 */
		PERCENT: 10,
		/** Floor in euros so tiny bookings still carry the fee. */
		MIN_EUROS: 2
	},

	/** Server-enforced listing limits (AccommodationsSystemDesign.md §3) — not just UI. */
	MIN_IMAGES: 3,
	MAX_IMAGES: 20,

	/**
	 * Calendar blocks: nights one block/unblock action may cover. Sanity ceiling so a
	 * fat-fingered range can't write years of rows (HostSystemDesign.md §4).
	 */
	MAX_BLOCK_NIGHTS_PER_ACTION: 366
} as const;

/**
 * Payments plumbing (PaymentsSystemDesign.md §8). Fee *amounts* live in
 * {@link ACCOMMODATIONS_CONFIG}; this is wiring, not pricing.
 */
export const PAYMENTS_CONFIG = {
	/**
	 * `'none'` until an adapter implementation is wired and verified
	 * (PaymentsSystemDesign.md §7). Gates every online-payment surface: listing forms
	 * cannot offer `online` while this is `'none'`.
	 */
	PROVIDER: 'none' as 'none' | 'stripe',

	/** Minutes an `awaiting` checkout may live before the reaper deletes the row (§3). */
	CHECKOUT_DEADLINE_MINUTES: 30,

	/**
	 * When held earnings become transferable. `'checked_out'` is what makes the
	 * no-clawback invariant true (PaymentsSystemDesign.md §5): before check-out the admin
	 * emergency brake can still refund, and money that already left for the host cannot be
	 * refunded. Do NOT flip this to check-in without first designing the clawback story
	 * this constant currently makes unnecessary.
	 */
	PAYOUT_TRIGGER: 'checked_out'
} as const;

/**
 * Server-side operational caps — batch sizes and per-run ceilings for crons and bulk
 * writes. These are budget guards, not product rules: they exist so a backlog after
 * downtime can't blow a single function's time/read budget. Raising one costs function
 * time; lowering it just means a sweep takes more runs to drain.
 */
export const OPERATIONAL_LIMITS = {
	/** Booking lifecycle sweep: rows examined per status per run. */
	BOOKING_LIFECYCLE_MAX_PER_RUN: 1_000,
	/** Listing-fee sweep: published listings examined per run (also caps the mode-flip backfill). */
	LISTING_FEE_SWEEP_MAX_PER_RUN: 1_000,
	/** Audit-log retention sweep: deletions per run. */
	AUDIT_LOG_MAX_DELETES_PER_RUN: 5_000,
	/** Aggregate backfill: rows per self-scheduling page. */
	AGGREGATE_BACKFILL_BATCH: 100,
	/** Orphan-file sweep: R2 metadata keys per page, and pages per run. */
	ORPHAN_CLEANUP_PAGE_SIZE: 200,
	ORPHAN_CLEANUP_MAX_PAGES: 25,
	/** `createDeleteMutation`: ids accepted per request unless a call site overrides it. */
	DEFAULT_MAX_DELETE_BATCH: 200,
	/**
	 * Search: published rows pulled before in-memory filtering. A scan cap, not a page
	 * size — see `fetchSearchAccommodationsSafe`.
	 */
	SEARCH_SCAN_LIMIT: 200
} as const;

/** Query tuning for the guest dashboard (`/guest/dashboard`). */
export const GUEST_DASHBOARD = {
	/** Hero + "more upcoming" rows — never return the whole upcoming list. */
	UPCOMING_LIMIT: 4,

	/**
	 * Past-stays count is a soft stat: `.take(CAP + 1)` bounds the read, and the tile shows
	 * "99+" past it. No counter table until a check-out mutation maintains one.
	 */
	CHECKED_OUT_COUNT_CAP: 99
} as const;

/** Query tuning for the host dashboard (`/host/dashboard`). Twin of {@link GUEST_DASHBOARD}. */
export const HOST_DASHBOARD = {
	/** Today strip: how many arrivals/departures/in-house rows to enrich into guest lines. */
	TODAY_DISPLAY_LIMIT: 3,

	/** Pending reservations: rows to enrich for the dashboard strip. */
	QUEUE_DISPLAY_LIMIT: 5,

	/**
	 * Pending reservations: bounded count for the strip — `.take(CAP + 1)` bounds the read
	 * and the UI renders "50+" past it. No counter table until one is maintained on write.
	 */
	QUEUE_COUNT_CAP: 50
} as const;

/** Upload ceilings enforced by BOTH storage backends (Convex storage and R2). */
export const UPLOAD_LIMITS = {
	MAX_UPLOAD_BYTES: 10 * 1024 * 1024 // 10 MB
} as const;

/** Free-text ceilings shared by Zod schemas and the mutations that trust them. */
export const CONTENT_LIMITS = {
	REPORT_MESSAGE_MAX: 5000
} as const;

/**
 * Cross-cutting business settings shared by the frontend and Convex.
 */
export const PROJECT_SETTINGS = {
	/**
	 * Booking statuses that count as money (revenue/GMV/occupancy aggregations) —
	 * real stays only, never pending/declined/cancelled.
	 */
	BOOKING_EARNING_STATUSES: ['confirmed', 'checked_in', 'checked_out']
} as const;

const MS_PER_HOUR = 60 * 60 * 1000;
export const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Shared booking rules — imported by Convex mutations and the Svelte UI. */
export const BOOKING_POLICY = {
	/** Host must confirm or decline a request within this window. */
	HOST_RESPONSE_HOURS: 48,
	/**
	 * One boundary, two consequences per payment method (BookingSystemDesign.md §4):
	 * - cash   — the LAST day a guest may self-cancel; inside it the booking is a
	 *            commitment (nothing is collectable from a late cash cancel).
	 * - online — the refund cutoff; cancelling stays possible until the day before
	 *            check-in but forfeits the payment inside this window.
	 * Snapshotted onto every booking at creation — changing it never moves live bookings.
	 */
	GUEST_FREE_CANCEL_DAYS_BEFORE_CHECKIN: 7,
	/**
	 * The day boundary every booking transition is measured against
	 * (BookingSystemDesign.md §3). Stay dates are ISO `YYYY-MM-DD` with no time component,
	 * so "today" must be resolved in the property's local day — not the server's UTC day
	 * (a 23:00 UTC cron run is already tomorrow in Belgrade) and not the viewer's.
	 *
	 * Platform-wide because every listing is physically in one city. Distinct from
	 * {@link DEFAULT_TIME_ZONE}, which is the per-listing *fallback* for a listing whose
	 * own `timeZone` never resolved.
	 */
	PROPERTY_TIMEZONE: 'Europe/Belgrade',

	/**
	 * Stay confirmation — the provable version of the §4 verification norm
	 * (BookingSystemDesign.md §4/§11). A host asks the guest to confirm in-product; both
	 * timestamps land on the booking, so "unresponsive" stops being a claim and becomes a
	 * fact the cancel guard can check.
	 *
	 * Hours a request must sit unanswered before the host's cash-inside-window cancel
	 * unlocks. Operational mechanics (not the guest's economic terms), so read live — NOT
	 * part of the policy snapshot.
	 */
	STAY_CONFIRMATION_UNLOCK_HOURS: 24,
	/** Minimum gap between confirmation requests on one booking — the anti-nag valve. */
	STAY_CONFIRMATION_COOLDOWN_HOURS: 48
} as const;

export const HOST_RESPONSE_MS = BOOKING_POLICY.HOST_RESPONSE_HOURS * MS_PER_HOUR;
export const STAY_CONFIRMATION_UNLOCK_MS =
	BOOKING_POLICY.STAY_CONFIRMATION_UNLOCK_HOURS * MS_PER_HOUR;
export const STAY_CONFIRMATION_COOLDOWN_MS =
	BOOKING_POLICY.STAY_CONFIRMATION_COOLDOWN_HOURS * MS_PER_HOUR;
