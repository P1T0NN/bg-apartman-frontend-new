<script lang="ts">
	// COMPONENTS
	import { Card } from '@/components/ui/card/index.js';
	import HostAnalyticsRevenueChart from '@/components/pages/(protected)/host/analytics/host-analytics-revenue-chart.svelte';
	import AdminDashboardChartEmpty from './empty/admin-dashboard-chart-empty.svelte';

	// TYPES
	import type { AdminDashboardPage } from '@/convex/pages/admin/dashboard/types/adminDashboardTypes';

	/**
	 * Band 3b — trailing 12 months, platform-wide. Reuses the host analytics chart
	 * composition verbatim: it is purely presentational, takes the same `{date, revenue,
	 * bookings}` series shape, and already carries the rAF-defer chart-container that
	 * client-side navigation needs. Fixed month buckets — no range picker on a status check
	 * (AdminDashboardPageSystemDesign.md §8).
	 */
	let { data }: { data: AdminDashboardPage['platform'] } = $props();

	const hasActivity = $derived(data.series.some((p) => p.bookings !== 0 || p.revenue !== 0));
</script>

<Card class="gap-0 p-4 sm:p-5">
	{#if hasActivity}
		<HostAnalyticsRevenueChart series={data.series} bucketUnit="month" />
	{:else}
		<AdminDashboardChartEmpty />
	{/if}
</Card>
