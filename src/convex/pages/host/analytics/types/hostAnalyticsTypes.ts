// Payload for `/host/analytics` (HostSystemDesign.md §2b) — the host's performance
// deep-dive: the 12-month trend chart and the per-listing table that used to sit on the
// dashboard. Moved to their own page so the dashboard stays "what needs me, what's today"
// and the heavy reads are paid for only when a host actually asks "how's business?".

// TYPES
import type { Doc, Id } from '@/convex/_generated/dataModel';

/** One bucket of the host's trend. `date` is the UTC bucket start (epoch ms). */
export type HostSeriesPoint = { date: number; revenue: number; bookings: number };

/** One of the host's published listings, over the requested window. */
export type HostAccommodationRow = {
	apartmentId: Id<'apartments'>;
	title: string;
	imageUrl: string;
	status: Doc<'apartments'>['status'];
	/** 0–100 over the requested window. */
	occupancyPct: number;
	/** Whole euros from stays checking in within the requested window. */
	revenue: number;
	/** Next upcoming stay from today — window-independent on purpose. */
	nextCheckIn: string | null;
};

export type HostAnalyticsData = {
	/** Zero-filled and oldest-first, one point per bucket across the requested window. */
	series: HostSeriesPoint[];
	/** Chosen by the server from the window length — the chart formats its axis with this. */
	bucketUnit: 'day' | 'month';
	/** The host's published listings, best occupancy first. */
	perAccommodation: HostAccommodationRow[];
};
