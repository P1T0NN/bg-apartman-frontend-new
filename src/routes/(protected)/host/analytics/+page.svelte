<script lang="ts">
	// I18N
	import { m } from '@/paraglide/messages';

	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useQuery } from 'convex-svelte';

	// TYPES
	import type { HostAnalyticsData } from '@/convex/pages/host/analytics/types/hostAnalyticsTypes';

	// COMPONENTS
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import ErrorComponent from '@/components/ui/error-component/error-component.svelte';
	import { type AnalyticsWindow } from '@/components/pages/(protected)/host/analytics/host-analytics-period-picker.svelte';
	import HostAnalyticsHeader from '@/components/pages/(protected)/host/analytics/host-analytics-header.svelte';
	import HostAnalyticsRevenueChart from '@/components/pages/(protected)/host/analytics/host-analytics-revenue-chart.svelte';
	import HostAnalyticsPerAccommodationTable from '@/components/pages/(protected)/host/analytics/host-analytics-per-accommodation-table.svelte';
	import HostAnalyticsLoading from '@/components/pages/(protected)/host/analytics/loading/host-analytics-loading.svelte';
	import HostAnalyticsEmpty from '@/components/pages/(protected)/host/analytics/empty/host-analytics-empty.svelte';

	/**
	 * "How's business, really?" (HostSystemDesign.md §2b) — the host's trend and per-listing
	 * performance over ONE page-wide period, chosen top-right (7d/30d/90d/custom). The
	 * picker resolves the choice to a `[from, to]` window; ONE read answers for the whole
	 * page, so the chart and the table can never describe different periods.
	 *
	 * A live subscription per window (GeneralSystemDesignRule.md), skipped until the picker
	 * resolves a complete range. Switching periods swaps the args and re-runs it; the heaviest
	 * host reads still run only while a host has this page open.
	 *
	 * Zero-listing visitors never get here — the host layout swaps in the become-host state
	 * for the whole area (HostSystemDesign.md §1).
	 *
	 * A fresh account sees an empty chart and an empty table — that IS the correct render for
	 * a host with no history. (The dev seeder that used to fill this page was deleted before
	 * launch; real bookings are the only source of numbers now.)
	 */
	let analyticsWindow = $state<AnalyticsWindow>(null);

	const analyticsQuery = useQuery(
		api.pages.host.analytics.queries.fetchHostAnalyticsSafe.fetchHostAnalyticsSafe,
		() => (analyticsWindow ? { from: analyticsWindow.from, to: analyticsWindow.to } : 'skip')
	);

	// `undefined` while skipped or loading → the page shows the loading skeletons, the state a
	// period change deserves. A window switch swaps the args and clears the previous data.
	const data = $derived(analyticsQuery.data as HostAnalyticsData | undefined);
	const failed = $derived(!!analyticsQuery.error);

	const hasAnything = $derived(
		data !== undefined &&
			(data.series.some((p) => p.bookings > 0 || p.revenue > 0) || data.perAccommodation.length > 0)
	);
</script>

<SvelteHead title={m['HostAnalyticsPage.SEO.title']()} description={m['HostAnalyticsPage.SEO.description']()} noIndex />

<section class="flex w-full flex-col gap-6 p-4 md:p-6">
	<HostAnalyticsHeader bind:analyticsWindow />

	{#if failed}
		<ErrorComponent
			variant="plain"
			title={m['HostAnalyticsPage.loadAnalyticsErrorTitle']()}
			description={m['HostAnalyticsPage.refreshPage']()}
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
