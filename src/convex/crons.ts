// LIBRARIES
import { cronJobs } from 'convex/server';

// CONFIG
import { internal } from './_generated/api';

// CRONS
import { registerStorageCrons } from './storage/registerStorageCrons';
import { registerAuditLogCrons } from './tables/auditLog/registerAuditLogCrons';
import { registerBookingCrons } from './tables/bookings/registerBookingCrons';
import { registerAccommodationCrons } from './tables/accommodations/registerAccommodationCrons';

/**
 * Scheduled jobs. Convex requires this file at the convex root, default-exporting
 * the registry.
 */
const crons = cronJobs();

registerStorageCrons(crons, internal);
registerAuditLogCrons(crons, internal);
registerBookingCrons(crons, internal);
registerAccommodationCrons(crons, internal);

// Analytics raw-event retention (rollups are kept forever). Staggered off the other daily
// sweeps so it never queues behind the storage/audit crons.
crons.daily(
	'prune analytics raw events',
	{ hourUTC: 4, minuteUTC: 30 },
	internal.analytics.analytics.pruneAnalyticsData
);

export default crons;
