<script lang="ts">
	// I18N
	import { m } from '@/paraglide/messages';

	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useQuery } from 'convex-svelte';

	// COMPONENTS
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import AdminDashboardHeader from '@/components/pages/(protected)/admin/dashboard/admin-dashboard-header.svelte';
	import AdminDashboardReportsQueue from '@/components/pages/(protected)/admin/dashboard/admin-dashboard-reports-queue.svelte';
	import AdminDashboardStatCards from '@/components/pages/(protected)/admin/dashboard/admin-dashboard-stat-cards.svelte';
	import AdminDashboardTrendChart from '@/components/pages/(protected)/admin/dashboard/admin-dashboard-trend-chart.svelte';
	import AdminDashboardPageLoading from '@/components/pages/(protected)/admin/dashboard/loading/admin-dashboard-page-loading.svelte';
	import { ErrorComponent } from '@/components/ui/error-component/index.js';

	// TYPES
	import type { AdminDashboardPage } from '@/convex/pages/admin/dashboard/types/adminDashboardTypes';

	/**
	 * One subscription to one aggregated query (AdminDashboardPageSystemDesign.md §4):
	 * reports, bookings and signups arrive from other people while the admin watches, and
	 * the whole read is aggregate counts + pre-aggregated rollups, so re-runs are cheap.
	 */
	const dashboard = useQuery(
		api.pages.admin.dashboard.queries.fetchAdminDashboardPageSafe.fetchAdminDashboardPageSafe,
		() => ({})
	);

	const data = $derived(dashboard.data as AdminDashboardPage | undefined);
</script>

<SvelteHead title={m['AdminDashboardPage.SEO.title']()} description={m['AdminDashboardPage.SEO.description']()} noIndex />

<section class="flex w-full flex-col gap-6 p-4 md:p-6">
	<AdminDashboardHeader />

	{#if dashboard.error}
		<ErrorComponent
			variant="alert"
			title={m['AdminDashboardPage.loadDashboardErrorTitle']()}
			description={m['AdminDashboardPage.loadDashboardErrorDescription']()}
		/>
	{:else if data === undefined}
		<AdminDashboardPageLoading />
	{:else}
		<AdminDashboardReportsQueue data={data.reportsQueue} />
		<AdminDashboardStatCards data={data.platform} />
		<AdminDashboardTrendChart data={data.platform} />
	{/if}
</section>
