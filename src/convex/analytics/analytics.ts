// LIBRARIES
import { ConvexError, v } from 'convex/values';
import {
	createAnalyticsResourceScope,
	createAnalyticsResourceScopeInput,
	defineAnalytics,
	event,
	property
} from '@piton-/analytics-convex';

// CONFIG
import { components } from '@/convex/_generated/api';
import { internalMutation, internalQuery } from '@/convex/_generated/server';
import { authComponent } from '@/convex/auth/auth';
import { requireAdmin } from '@/convex/auth/middleware/authMiddleware';

// TYPES
import type { QueryCtx } from '@/convex/_generated/server';
import type { ConvexErrorPayload } from '@/shared/types/types';

/**
 * Stable event-name constants for product code. The library is the analytics
 * engine now; this map just keeps tracking call sites typo-safe and readable.
 *
 * The keys here mirror the dotted event names registered in `defineAnalytics`
 * below — keep the two lists in sync.
 */
export const ANALYTICS_EVENT = {
	BOOKING_CREATED: 'booking.created',
	BOOKING_CONFIRMED: 'booking.confirmed',
	BOOKING_CANCELLED: 'booking.cancelled',
	BOOKING_NIGHTS_BOOKED: 'booking.nights_booked',
	BOOKING_NIGHTS_RELEASED: 'booking.nights_released',
	INVOICE_PAID: 'invoice.paid',
	INVOICE_FAILED: 'invoice.failed',
	REFUND_CREATED: 'refund.created',
	SUBSCRIPTION_CREATED: 'subscription.created',
	SUBSCRIPTION_CANCELLED: 'subscription.cancelled',
	USER_SIGNED_UP: 'user.signed_up',
	FILE_UPLOADED: 'file.uploaded',
	STORAGE_USAGE_RECORDED: 'storage.usage_recorded',
	FEATURE_USED: 'feature.used'
} as const;

/**
 * Per-host analytics partition. Booking lifecycle events are tracked with this resource
 * scope so the host dashboard reads its revenue/bookings series straight from the
 * pre-aggregated rollups instead of scanning the bookings table. The `'host'` resource
 * type literal lives ONLY here so the tracking scope and the query scope can never drift.
 */
export const hostAnalyticsScope = (hostId: string) => createAnalyticsResourceScope('host', hostId);

/** Query-side twin of {@link hostAnalyticsScope} — same resource type, same ID derivation. */
export const hostAnalyticsScopeInput = (hostId: string) =>
	createAnalyticsResourceScopeInput('host', hostId);

/**
 * Metrics that require the Better Auth `admin` role to read. Everything else
 * only requires a signed-in user. Enforced in the `authorize` callback below
 * because the library runs `authorize` for the `analytics.client.*` wrappers
 * the browser calls. Keep this in sync with the `.adminOnly()` metrics.
 */
const ADMIN_ONLY_METRICS = new Set<string>([
	'revenue',
	'refunds',
	'failedPayments',
	'featureUsage',
	'gmv',
	'gmvCancelled'
]);

function _throwNotAuthenticated(): never {
	throw new ConvexError({
		code: 'NOT_AUTHENTICATED',
		message: { key: 'GenericMessages.NOT_AUTHENTICATED' }
	} satisfies ConvexErrorPayload);
}

/**
 * In-app analytics, backed by the `@piton-/analytics-convex` component.
 *
 * Events and metrics are runtime config: the generated helpers pass the config
 * hash to the component automatically. Server helpers (`analytics.track`,
 * `analytics.fetchSummary`, …) bypass `authorize` and are for Convex functions
 * that already enforce their own auth. The `analytics.client.*` wrappers (which
 * the browser calls) run `authorize`.
 */
export const analytics = defineAnalytics(components.analytics, {
	events: {
		bookingCreated: event('booking.created', {
			label: 'Booking created',
			properties: {
				paymentMethod: property.string(),
				instant: property.boolean()
			}
		}),
		// Tracked whenever a booking becomes confirmed: instant bookings at creation,
		// pending requests when the host confirms. `totalEuros` feeds the GMV metric.
		bookingConfirmed: event('booking.confirmed', {
			label: 'Booking confirmed',
			properties: {
				totalEuros: property.number({ required: true }),
				paymentMethod: property.string()
			}
		}),
		// Tracked ONLY when a booking leaves an earning status (confirmed/checked_in) —
		// withdrawn/declined pending requests never carried GMV, so they don't emit this.
		bookingCancelled: event('booking.cancelled', {
			label: 'Booking cancelled (after confirmation)',
			properties: {
				totalEuros: property.number({ required: true }),
				cancelledBy: property.string()
			}
		}),
		/**
		 * Occupancy, pre-split by calendar month. Emitted ONE PER MONTH a stay touches, with
		 * `occurredAt` dated into that month — so a stay straddling July/August emits two
		 * events, each carrying only its own side of the boundary (`nightsByMonth`).
		 *
		 * Why an event and not an aggregate: "nights booked in July" is a function of
		 * (booking, window), not a property of the booking row, and an aggregate's `sumValue`
		 * can only read a scalar off the row. Splitting at write time is what lets the host
		 * dashboard read occupancy from the rollups instead of scanning every booking.
		 */
		bookingNightsBooked: event('booking.nights_booked', {
			label: 'Nights booked',
			properties: { nights: property.number({ required: true }) }
		}),
		/**
		 * The reversal twin, same split, same dating — subtract from `nightsBooked` per bucket
		 * exactly as `gmvCancelled` is subtracted from `gmv`. Emitted only when a booking
		 * leaves an earning status, because only then were the nights ever counted.
		 */
		bookingNightsReleased: event('booking.nights_released', {
			label: 'Nights released',
			properties: { nights: property.number({ required: true }) }
		}),
		invoicePaid: event('invoice.paid', {
			label: 'Invoice paid',
			properties: {
				amountCents: property.number({ required: true }),
				currency: property.string({ required: true }),
				plan: property.string(),
				provider: property.string()
			}
		}),
		invoiceFailed: event('invoice.failed', {
			label: 'Invoice failed',
			properties: {
				amountCents: property.number(),
				currency: property.string({ required: true }),
				plan: property.string(),
				provider: property.string(),
				reason: property.string()
			}
		}),
		refundCreated: event('refund.created', {
			label: 'Refund created',
			properties: {
				amountCents: property.number({ required: true }),
				currency: property.string({ required: true }),
				plan: property.string(),
				provider: property.string()
			}
		}),
		subscriptionCreated: event('subscription.created', {
			label: 'Subscription created',
			properties: {
				plan: property.string({ required: true }),
				provider: property.string()
			}
		}),
		subscriptionCancelled: event('subscription.cancelled', {
			label: 'Subscription cancelled',
			properties: {
				plan: property.string({ required: true }),
				provider: property.string(),
				reason: property.string()
			}
		}),
		userSignedUp: event('user.signed_up', {
			label: 'User signed up',
			properties: {
				provider: property.string(),
				role: property.string(),
				plan: property.string()
			}
		}),
		fileUploaded: event('file.uploaded', {
			label: 'File uploaded',
			properties: {
				provider: property.string(),
				mimeType: property.string(),
				bytes: property.number()
			}
		}),
		storageUsageRecorded: event('storage.usage_recorded', {
			label: 'Storage usage recorded',
			properties: {
				provider: property.string(),
				bytes: property.number({ required: true })
			}
		}),
		featureUsed: event('feature.used', {
			label: 'Feature used',
			properties: {
				feature: property.string({ required: true }),
				surface: property.string()
			}
		})
	},
	metrics: ({ count, sum }) => ({
		bookings: count('Bookings').from('booking.created').by('paymentMethod'),
		// Count twins of the GMV sums — power the host dashboard's bookings series
		// (net = confirmed − cancelled per bucket) and the booking-conversion funnel.
		bookingsConfirmed: count('Bookings confirmed').from('booking.confirmed').by('paymentMethod'),
		bookingsCancelled: count('Bookings cancelled').from('booking.cancelled').by('cancelledBy'),
		// Occupancy numerator: `nightsBooked − nightsReleased` per month bucket. NOT admin-only
		// — a host reads their own occupancy, and the host resource scope already partitions
		// the rollups so one host can never read another's.
		nightsBooked: sum('Nights booked', 'count')
			.description('Booked nights, split into the calendar month each night falls in')
			.from('booking.nights_booked')
			.value('nights'),
		nightsReleased: sum('Nights released', 'count')
			.description('Nights freed by cancellation — subtract from Nights booked')
			.from('booking.nights_released')
			.value('nights'),
		gmv: sum('GMV', 'currency')
			.description('Confirmed booking totals (whole euros)')
			.from('booking.confirmed')
			.value('totalEuros')
			.by('paymentMethod')
			.adminOnly(),
		gmvCancelled: sum('Cancelled GMV', 'currency')
			.description('Totals of bookings cancelled after confirmation — subtract from GMV')
			.from('booking.cancelled')
			.value('totalEuros')
			.by('cancelledBy')
			.adminOnly(),
		revenue: sum('Revenue', 'currency')
			.description('Gross paid invoice amount')
			.from('invoice.paid')
			.value('amountCents')
			.by('plan', 'currency', 'provider')
			.adminOnly(),
		refunds: sum('Refunds', 'currency')
			.from('refund.created')
			.value('amountCents')
			.by('plan', 'currency', 'provider')
			.adminOnly(),
		failedPayments: count('Failed payments')
			.from('invoice.failed')
			.by('plan', 'currency', 'provider', 'reason')
			.adminOnly(),
		newSubscriptions: count('New subscriptions')
			.from('subscription.created')
			.by('plan', 'provider'),
		cancelledSubscriptions: count('Cancelled subscriptions')
			.from('subscription.cancelled')
			.by('plan', 'provider', 'reason'),
		newUsers: count('New users').from('user.signed_up').by('provider', 'role', 'plan'),
		uploads: count('Uploads').from('file.uploaded').by('provider', 'mimeType'),
		storageUsedBytes: sum('Storage used', 'bytes')
			.from('storage.usage_recorded', 'file.uploaded')
			.value('bytes')
			.by('provider', 'mimeType'),
		featureUsage: count('Feature usage').from('feature.used').by('feature', 'surface').adminOnly()
	}),
	/**
	 * No `distinctActors` metric is defined, and the component only writes actor-claim rows
	 * for that aggregation — so `analyticsDailyActorClaims` is empty by construction and the
	 * 2.0 `backfillMonthActorClaims` upgrade step does not apply to this deployment. Adding a
	 * `distinctActors` metric from here on needs no backfill either: month claims are written
	 * automatically from 2.0 onward. (Not that it could run: the component mutation behind it
	 * calls `.paginate()`, which Convex rejects inside a component — upstream bug in 2.0.0.)
	 */
	settings: {
		trafficMode: 'mediumVolume',
		mediumVolumeShardCount: 16,
		highVolumeShardCount: 64,
		highVolumeBatchSize: 500,
		highVolumeBatchIntervalMinutes: 1,
		highVolumeMaxCatchupBatches: 20,
		maxQueryRangeDays: 366,
		maxBreakdownItems: 25,
		rawEventRetentionDays: 90
		// `maxRollupRowsPerQuery` / `maxRawEventDeletesPerRun` are left at the library defaults
		// on purpose. Since 2.0 the read budget is SHARED across every rollup read in one
		// query, so the old 5,000 override would now be split between the dashboard's many
		// metric reads instead of granted to each; and the delete cap is hard-limited to 4,096
		// (a 5,000 override fails config validation outright).
	},
	/**
	 * Runs only for the `analytics.client.*` wrappers the browser can call.
	 * Mirrors the previous `requireAnalyticsReadAccess` gate: all reads need a
	 * signed-in user; admin-only metrics additionally need the `admin` role.
	 */
	authorize: async (ctx, operation) => {
		// At runtime the library passes the real query/mutation ctx; the public
		// type is narrowed to `{ auth }`.
		const authCtx = ctx as unknown as QueryCtx;

		if (operation.type === 'read') {
			const requested = operation.metrics ?? (operation.metric ? [operation.metric] : []);

			if (requested.some((metric) => ADMIN_ONLY_METRICS.has(metric))) {
				await requireAdmin(authCtx);
				return;
			}

			const user = await authComponent.getAuthUser(authCtx);
			if (!user) _throwNotAuthenticated();
			return;
		}

		// configure / configureMetricEvaluation / track are not exposed as client
		// endpoints in this app. If one is ever re-exported, lock it to admins.
		await requireAdmin(authCtx);
	}
});

/**
 * Maintenance cron handlers. Registered in `convex/crons.ts` via
 * `analytics.registerCrons(...)`. Exported here so Convex registers them as
 * internal mutations under `internal.analytics.analytics.*`.
 */
export const {
	processPendingHighVolumeAnalyticsEvents,
	purgeStaleAnalyticsEvents,
	purgeStaleAnalyticsRollups,
	// 2.0: collapses shard rows on buckets older than ~2 days into one, so historical reads
	// lose the 16x shard multiplier. `registerCrons` schedules it, so it MUST be exported.
	compactAnalyticsRollups
} = analytics.crons;

/**
 * Eagerly registers the current events/metrics config with the analytics
 * component. Run via `bun run analytics:configure` (part of `predev`) so
 * dashboards can read newly added metrics before the first tracked event
 * registers the config hash lazily.
 */
export const writeConfiguration = internalMutation({
	args: {},
	handler: async (ctx) => await analytics.writeConfiguration(ctx)
});

/**
 * Ghost-data audit (2.0). Reports rows still stored for metrics/journeys that no longer
 * exist in the config above, plus how many stored config blobs are prunable.
 *
 * Rows for a deleted metric are invisible — no query names it, so it never shows up in a
 * dashboard, it just bills storage forever. This is the only way to see them.
 *
 * ```bash
 * bunx convex run analytics/analytics:dataAudit
 * bunx convex run analytics/analytics:dataAudit --prod
 * ```
 *
 * Anything in `orphanedMetrics` / `orphanedJourneys` is deleted with {@link pruneData}.
 * Run this whenever a metric is renamed or removed — a rename is a delete plus an add, so
 * the old name's rollups are left behind by definition.
 */
export const dataAudit = internalQuery({
	args: {},
	handler: async (ctx) => await analytics.fetchDataAudit(ctx)
});

/**
 * Deletes the rows {@link dataAudit} found, in budgeted self-scheduling batches. Refuses
 * any name still present in the config, so it cannot delete live data by typo.
 *
 * ```bash
 * bunx convex run analytics/analytics:pruneData "{metrics:['oldMetricName']}"
 * ```
 *
 * Returns `{ deleted, scheduledNextBatch }` — `scheduledNextBatch: true` means it chained
 * another batch and is still running. Re-run {@link dataAudit} afterwards to confirm.
 */
export const pruneData = internalMutation({
	args: {
		metrics: v.optional(v.array(v.string())),
		journeys: v.optional(v.array(v.string()))
	},
	handler: async (ctx, args) => await analytics.pruneData(ctx, args)
});

/**
 * High-volume ingestion health (2.0): pending backlog, per-cycle drain capacity, and the
 * oldest pending event's age. `backlogExceedsCycle: true` means the batch cron is losing
 * ground and events are queueing faster than they aggregate.
 *
 * ```bash
 * bunx convex run analytics/analytics:ingestionHealth --prod
 * ```
 *
 * Today every metric runs at the global `mediumVolume` mode, which aggregates inline — so
 * this reads a flat zero and there is nothing to alarm on. The moment ANY metric gets
 * `.trafficMode('highVolume')`, its events go through the pending queue instead, and this
 * becomes the number that tells you whether `highVolumeBatchSize` /
 * `highVolumeBatchIntervalMinutes` keep up. Put it on a cron then, not before.
 */
export const ingestionHealth = internalQuery({
	args: {},
	handler: async (ctx) => await analytics.fetchIngestionHealth(ctx)
});
