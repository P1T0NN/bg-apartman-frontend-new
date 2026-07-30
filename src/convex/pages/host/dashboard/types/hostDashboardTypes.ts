// Payloads for the host dashboard (`/host/dashboard`), split into TWO reads that match
// how the data actually behaves (GeneralSystemDesignRule.md — realtime is opt-in):
//
//   1. `HostPendingReservations` — SUBSCRIPTION. Requests arrive from guests and the
//      lifecycle cron expires them while the host watches; the strip must move on its own.
//   2. `HostDashboardStats`      — one-shot. Changes only when the host acts elsewhere
//      (adds a listing, confirms a booking) or a day boundary passes.
//
// They were one query once. Splitting them means the expensive leg is paid for once per
// visit instead of re-running on every write to this host's rows. The 12-month trend chart
// and the per-listing table moved to `/host/analytics` — performance depth got its own
// page (HostSystemDesign.md §2b).

// TYPES
import type { Id } from '@/convex/_generated/dataModel';
import type { typesBookingSafe } from '@/shared/features/booking/types/bookingTypes';

// --- 1. Pending reservations (live strip; host acts on the reservations page) ---

export type HostPendingReservations = {
	/** Up to a display limit of pending bookings, most urgent (soonest expiry) first. */
	items: typesBookingSafe[];
	/** Total pending count, capped (UI renders "50+" when `capped`). */
	total: number;
	capped: boolean;
};

// --- 2. Stats: today strip, earnings card, tiles, per-accommodation table ---

export type HostTodayRow = {
	bookingId: Id<'bookings'>;
	guestName: string;
	accommodationTitle: string;
};
export type HostTodaySlice = { items: HostTodayRow[]; total: number };
export type HostToday = {
	checkIns: HostTodaySlice;
	checkOuts: HostTodaySlice;
	hosting: HostTodaySlice;
};

/**
 * The ONE persistent payout card, zero modals, zero interstitials. It shows the held
 * balance and one button, and never blocks any host action. `null` when the host has
 * nothing held and no payout account — a host who only ever takes cash never sees a
 * payment surface (PaymentsSystemDesign.md §2).
 */
export type HostEarningsCard = {
	/** Whole euros waiting: sum of `net` over this host's `held` earning rows. */
	heldEuros: number;
	/**
	 * Provider confirmed transfers active (stage 4). `false` = stage 3, the card asks for
	 * payout details; `true` = the card is just an earnings summary and asks for nothing,
	 * ever again.
	 */
	payable: boolean;
};

export type HostStatTiles = {
	/** 0–100, this calendar month. */
	occupancy: { pct: number; deltaPts: number };
	revenue: { amount: number; deltaAmount: number };
	upcomingCheckIns: { count: number; nextDate: string | null };
};

export type HostDashboardStats = {
	accommodations: { total: number; published: number; pendingReview: number };
	/** First published accommodation's slug (else any accommodation's), for the "share to get
	 *  bookings" empty state. `null` when the host has no accommodations. */
	firstAccommodationSlug: string | null;
	/** Gates the "you have activity" half of the page. */
	hasAnyBookings: boolean;
	today: HostToday;
	/** `null` = no money surface for this host at all. */
	earnings: HostEarningsCard | null;
	tiles: HostStatTiles;
};
