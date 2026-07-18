// LIBRARIES
import { ConvexError } from 'convex/values';
import {
	createAnalyticsResourceScope,
	createAnalyticsResourceScopeInput,
	defineAnalytics,
	event,
	property
} from '@piton-/analytics-convex';

// CONFIG
import { components } from '@/convex/_generated/api';
import { internalMutation } from '@/convex/_generated/server';
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
	settings: {
		trafficMode: 'mediumVolume',
		mediumVolumeShardCount: 16,
		highVolumeShardCount: 64,
		highVolumeBatchSize: 500,
		highVolumeBatchIntervalMinutes: 1,
		highVolumeMaxCatchupBatches: 20,
		maxQueryRangeDays: 366,
		maxRollupRowsPerQuery: 5_000,
		maxBreakdownItems: 25,
		rawEventRetentionDays: 90,
		maxRawEventDeletesPerRun: 5_000
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
	purgeStaleAnalyticsRollups
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
