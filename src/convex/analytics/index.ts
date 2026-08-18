/**
 * App-facing analytics barrel.
 *
 * Analytics is powered by `@vllnt/convex-analytics` (COUNT rollups) plus `@convex-dev/aggregate`
 * (SUM rollups — see `./sumRollups.ts`). Product code tracks the one COUNT event with
 * `analytics.track`, records money/occupancy with `recordGmv` / `recordNights`, and reads
 * every series through `analytics.fetchTimeSeries`.
 */
export { analytics, ANALYTICS_EVENT } from './analytics';
export {
	recordGmv,
	recordNights,
	recordPlatformRevenue,
	recordPlatformFeeRefund
} from './sumRollups';
