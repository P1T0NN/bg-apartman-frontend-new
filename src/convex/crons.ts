// LIBRARIES
import { cronJobs } from 'convex/server';

// CONFIG
import { internal } from './_generated/api';

// CRONS
import { analytics } from './analytics/analytics';
import { registerStorageCrons } from './storage/registerStorageCrons';
import { registerAuditLogCrons } from './tables/auditLog/registerAuditLogCrons';
import { registerBookingCrons } from './tables/bookings/registerBookingCrons';
import { registerAccommodationCrons } from './tables/accommodations/registerAccommodationCrons';
import { registerPaymentCrons } from './payments/registerPaymentCrons';

/**
 * Scheduled jobs. Convex requires this file at the convex root, default-exporting
 * the registry.
 */
const crons = cronJobs();

registerStorageCrons(crons, internal);
registerAuditLogCrons(crons, internal);
registerBookingCrons(crons, internal);
registerAccommodationCrons(crons, internal);
registerPaymentCrons(crons, internal);

// Analytics maintenance (high-volume rollup batching + raw event/rollup retention).
// Handlers are exported from `./analytics/analytics.ts`, so they live under
// `internal.analytics.analytics.*`.
analytics.registerCrons(crons, internal.analytics.analytics, {
	highVolumeBatchIntervalMinutes: 1,
	retentionIntervalHours: 24
});

export default crons;
