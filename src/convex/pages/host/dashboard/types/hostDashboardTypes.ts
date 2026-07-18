// Lean payload returned by `fetchHostDashboardPageSafe` — everything the host dashboard
// (`/host/dashboard`) renders, in one snapshot. Grouped into three sections that map to the
// page's regions: the "needs your response" queue, the today strip, and the stats block.

// TYPES
import type { Doc, Id } from '@/convex/_generated/dataModel';
import type { typesBookingSafe } from '@/shared/features/booking/types/bookingTypes';

// --- Pending reservations (read-only strip; host acts on the reservations page) ---

export type HostPendingReservations = {
	/** Up to a display limit of pending bookings, most urgent (soonest expiry) first. */
	items: typesBookingSafe[];
	/** Total pending count, capped (UI renders "50+" when `capped`). */
	total: number;
	capped: boolean;
};

// --- Today strip (arrivals / departures / in-house) ---

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

// --- Stats block (tiles, revenue chart, per-accommodation table) ---

export type HostStatTiles = {
	/** 0–100, this calendar month. */
	occupancy: { pct: number; deltaPts: number };
	revenue: { amount: number; deltaAmount: number };
	upcomingCheckIns: { count: number; nextDate: string | null };
};
export type HostSeriesPoint = { date: number; revenue: number; bookings: number };
export type HostAccommodationRow = {
	apartmentId: Id<'apartments'>;
	title: string;
	imageUrl: string;
	status: Doc<'apartments'>['status'];
	occupancyPct: number;
	revenue: number;
	nextCheckIn: string | null;
};
export type HostDashboardStats = {
	accommodations: { total: number; published: number; pendingReview: number };
	/** First published accommodation's slug (else any accommodation's), for the "share to get
	 *  bookings" empty state. `null` when the host has no accommodations. */
	firstAccommodationSlug: string | null;
	hasAnyBookings: boolean;
	tiles: HostStatTiles;
	series: HostSeriesPoint[];
	perAccommodation: HostAccommodationRow[];
};

// --- Composed page payload ---

export type HostDashboardData = {
	pendingReservations: HostPendingReservations;
	today: HostToday;
	stats: HostDashboardStats;
};
