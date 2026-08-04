<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useConvexClient } from 'convex-svelte';

	// COMPONENTS
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import ErrorComponent from '@/components/ui/error-component/error-component.svelte';
	import { type AnalyticsWindow } from '@/components/pages/(protected)/host/analytics/host-analytics-period-picker.svelte';
	import HostAnalyticsHeader from '@/components/pages/(protected)/host/analytics/host-analytics-header.svelte';
	import HostAnalyticsRevenueChart from '@/components/pages/(protected)/host/analytics/host-analytics-revenue-chart.svelte';
	import HostAnalyticsPerAccommodationTable from '@/components/pages/(protected)/host/analytics/host-analytics-per-accommodation-table.svelte';
	import HostAnalyticsLoading from '@/components/pages/(protected)/host/analytics/loading/host-analytics-loading.svelte';
	import HostAnalyticsEmpty from '@/components/pages/(protected)/host/analytics/empty/host-analytics-empty.svelte';

	// UTILS
	import { safeQuery } from '@/utils/convexHelpers';

	// TYPES
	import type { HostAnalyticsData } from '@/convex/pages/host/analytics/types/hostAnalyticsTypes';

	/**
	 * "How's business, really?" (HostSystemDesign.md §2b) — the host's trend and per-listing
	 * performance over ONE page-wide period, chosen top-right (7d/30d/90d/custom). The
	 * picker resolves the choice to a `[from, to]` window; ONE fetch answers for the whole
	 * page, so the chart and the table can never describe different periods.
	 *
	 * One-shot per window (GeneralSystemDesignRule.md): window aggregates don't move under
	 * a viewer — switching periods refetches, which is always fresh enough, and the
	 * heaviest host reads run only when a host actually asks.
	 *
	 * Zero-listing visitors never get here — the host layout swaps in the become-host state
	 * for the whole area (HostSystemDesign.md §1).
	 *
	 * Want plausible numbers on a fresh dev account? `dev/seedMockBookings` seeds a year of
	 * bookings AND their rollup events through the real pipeline, so this page renders
	 * exactly what production would — chart and table from the same rows.
	 */
	const convex = useConvexClient();

	let analyticsWindow = $state<AnalyticsWindow>(null);
	let data = $state<HostAnalyticsData | undefined>();
	let failed = $state(false);

	// Refetches whenever the picker resolves a new window. The token drops stale responses:
	// with two switches in flight, only the latest lands (`data = undefined` shows the
	// skeletons in between — the loading state a period change deserves).
	let fetchToken = 0;
	$effect(() => {
		if (!analyticsWindow) return; // custom picked but range not complete yet — keep what's shown

		const args = { from: analyticsWindow.from, to: analyticsWindow.to };
		const token = ++fetchToken;
		data = undefined;
		failed = false;

		safeQuery(
			convex,
			api.pages.host.analytics.queries.fetchHostAnalyticsSafe.fetchHostAnalyticsSafe,
			args
		).then((payload) => {
			if (token !== fetchToken) return;
			if (payload) data = payload;
			else failed = true;
		});
	});

	const hasAnything = $derived(
		data !== undefined &&
			(data.series.some((p) => p.bookings > 0 || p.revenue > 0) || data.perAccommodation.length > 0)
	);
</script>

<SvelteHead title="Analytics" description="How your accommodations are performing." noIndex />

<section class="flex w-full flex-col gap-6 p-4 md:p-6">
	<HostAnalyticsHeader bind:analyticsWindow />

	{#if failed}
		<ErrorComponent
			variant="plain"
			title="Could not load analytics"
			description="Try refreshing the page."
			showRetry={false}
		/>
	{:else if data === undefined}
		<HostAnalyticsLoading />
	{:else if !hasAnything}
		<HostAnalyticsEmpty />
	{:else}
		<HostAnalyticsRevenueChart series={data.series} bucketUnit={data.bucketUnit} />
		<HostAnalyticsPerAccommodationTable rows={data.perAccommodation} />
	{/if}
</section>
