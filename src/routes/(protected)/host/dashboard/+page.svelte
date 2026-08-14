<script lang="ts">
	// I18N
	import { m } from '@/paraglide/messages';

	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useQuery } from 'convex-svelte';

	// TYPES
	import type { HostDashboardStats } from '@/convex/pages/host/dashboard/types/hostDashboardTypes';

	// COMPONENTS
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import HostDashboardHeader from '@/components/pages/(protected)/host/dashboard/host-dashboard-header.svelte';
	import HostDashboardPendingReservations from '@/components/pages/(protected)/host/dashboard/host-dashboard-pending-reservations/host-dashboard-pending-reservations.svelte';
	import HostDashboardEarnings from '@/components/pages/(protected)/host/dashboard/host-dashboard-earnings.svelte';
	import HostDashboardTodayOverview from '@/components/pages/(protected)/host/dashboard/host-dashboard-today-overview.svelte';
	import HostDashboardStatCards from '@/components/pages/(protected)/host/dashboard/host-dashboard-stat-cards.svelte';
	import HostDashboardNoBookingsEmpty from '@/components/pages/(protected)/host/dashboard/empty/host-dashboard-no-bookings-empty.svelte';
	import HostDashboardStatsSectionLoading from '@/components/pages/(protected)/host/dashboard/loading/host-dashboard-stats-section-loading.svelte';
	import { ErrorComponent } from '@/components/ui/error-component/index.js';

	/**
	 * Band order (HostSystemDesign.md §2): 1) pending strip, 2) earnings card, 3) today,
	 * 4) stat tiles. The trend chart and per-listing table live on `/host/analytics` (§2b).
	 *
	 * One live read for everything below the pending strip: the earnings card, the today
	 * strip and the tiles all come from the same payload, so they share one subscription
	 * instead of firing the same query three times. Live because the lifecycle cron advances
	 * bookings and the payout scheduler moves earnings while the host watches.
	 *
	 * Zero-listing visitors never get here — the host layout swaps in the become-host state
	 * for the whole area (HostSystemDesign.md §1).
	 */
	const statsQuery = useQuery(
		api.pages.host.dashboard.queries.fetchHostDashboardStats.fetchHostDashboardStats,
		() => ({})
	);

	const stats = $derived(statsQuery.data as HostDashboardStats | undefined);
	const loadingStats = $derived(statsQuery.isLoading);
	const errorStats = $derived(!!statsQuery.error);
</script>

<SvelteHead title={m['HostDashboardPage.SEO.title']()} description={m['HostDashboardPage.SEO.description']()} noIndex />

<section class="flex w-full flex-col gap-6 p-4 md:p-6">
	<HostDashboardHeader />

	<HostDashboardPendingReservations />

	{#if errorStats}
		<ErrorComponent
			variant="alert"
			title={m['HostDashboardPage.loadDashboardErrorTitle']()}
			description={m['HostDashboardPage.loadDashboardErrorDescription']()}
		/>
	{:else if loadingStats || stats === undefined}
		<HostDashboardStatsSectionLoading />
	{:else}
		<HostDashboardEarnings data={stats.earnings} />

		{#if stats.hasAnyBookings}
			<HostDashboardTodayOverview data={stats.today} />
			<HostDashboardStatCards {stats} />
		{:else}
			<HostDashboardStatCards {stats} />
			<HostDashboardNoBookingsEmpty />
		{/if}
	{/if}
</section>
