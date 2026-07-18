<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useQuery } from 'convex-svelte';
	import { m } from '@/shared/lib/paraglide/messages';

	// COMPONENTS
	import SvelteHead from '@/shared/components/ui/svelte-head/svelte-head.svelte';
	import HostDashboardHeader from '@/shared/components/pages/(protected)/host/dashboard/host-dashboard-header.svelte';
	import HostDashboardPageError from '@/shared/components/pages/(protected)/host/dashboard/error/host-dashboard-page-error.svelte';
	import HostDashboardPageLoading from '@/shared/components/pages/(protected)/host/dashboard/loading/host-dashboard-page-loading.svelte';
	import HostDashboardPageEmpty from '@/shared/components/pages/(protected)/host/dashboard/empty/host-dashboard-page-empty.svelte';
	import HostDashboardNoBookingsEmpty from '@/shared/components/pages/(protected)/host/dashboard/empty/host-dashboard-no-bookings-empty.svelte';
	import HostDashboardPendingReservations from '@/shared/components/pages/(protected)/host/dashboard/host-dashboard-pending-reservations.svelte';
	import HostDashboardTodayOverview from '@/shared/components/pages/(protected)/host/dashboard/host-dashboard-today-overview.svelte';
	import HostDashboardStatCards from '@/shared/components/pages/(protected)/host/dashboard/host-dashboard-stat-cards.svelte';
	import HostDashboardRevenueChart from '@/shared/components/pages/(protected)/host/dashboard/host-dashboard-revenue-chart.svelte';
	import HostDashboardPerAccommodationTable from '@/shared/components/pages/(protected)/host/dashboard/host-dashboard-per-accommodation-table.svelte';

	const dashboard = useQuery(
		api.pages.host.dashboard.queries.fetchHostDashboardPageSafe.fetchHostDashboardPageSafe,
		() => ({})
	);

	const statsData = $derived(dashboard.data?.stats);
	const statsLoading = $derived(dashboard.data === undefined && !dashboard.error);

	const noAccommodations = $derived(statsData !== undefined && statsData.accommodations.total === 0);
	const hasBookings = $derived(statsData?.hasAnyBookings ?? false);
</script>

<SvelteHead
	title={m['HostDashboardPage.SEO.title']()}
	description={m['HostDashboardPage.SEO.description']()}
	noIndex
/>

<section class="flex w-full flex-col gap-6 p-4 md:p-6">
	<HostDashboardHeader />

	{#if dashboard.error}
		<HostDashboardPageError />
	{:else if statsLoading}
		<HostDashboardPageLoading />
	{:else if noAccommodations}
		<HostDashboardPageEmpty />
	{:else if statsData}
		<HostDashboardPendingReservations data={dashboard.data?.pendingReservations} />

		{#if hasBookings}
			<HostDashboardTodayOverview data={dashboard.data?.today} />
			<HostDashboardStatCards stats={statsData} />
			<HostDashboardRevenueChart series={statsData.series} />
			<HostDashboardPerAccommodationTable rows={statsData.perAccommodation} />
		{:else}
			<HostDashboardStatCards stats={statsData} />
			<HostDashboardNoBookingsEmpty />
		{/if}
	{/if}
</section>
