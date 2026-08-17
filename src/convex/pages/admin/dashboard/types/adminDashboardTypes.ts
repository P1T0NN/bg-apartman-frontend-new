// TYPES
import type { Doc, Id } from '@/convex/_generated/dataModel';

/** One row of the "needs attention" band — a new (unresolved) public report. */
export type AdminDashboardReportItem = {
	_id: Id<'reports'>;
	category: Doc<'reports'>['category'];
	/** Full message; the client truncates for display. */
	message: string;
	email: string | null;
	_creationTime: number;
};

/** One month of the trailing-12-months trend. `date` is the UTC month-start timestamp. */
export type AdminDashboardSeriesPoint = {
	date: number;
	bookings: number;
	revenue: number;
};

/**
 * Everything `/admin/dashboard` renders, in band order
 * (AdminDashboardPageSystemDesign.md §3). Raw data only — the client formats EUR,
 * relative times, and truncation.
 */
export type AdminDashboardPage = {
	reportsQueue: {
		/** ≤ 5, newest first, unresolved only. */
		items: AdminDashboardReportItem[];
		/** Exact count of unresolved reports (aggregate; client caps the display). */
		total: number;
	};
	platform: {
		/** Exact count, maintained by the better-auth user triggers (counter read, never a scan). */
		usersTotal: number;
		publishedListings: number;
		bookingsThisMonth: number;
		/**
		 * PLATFORM revenue, whole EUR — what we earn (listing fees + collected booking
		 * fees, net of fee refunds), never hosts' booking money (ADPSD §1, ASD §8).
		 */
		revenueThisMonth: number;
		/** 12 entries, oldest first. */
		series: AdminDashboardSeriesPoint[];
	};
};
