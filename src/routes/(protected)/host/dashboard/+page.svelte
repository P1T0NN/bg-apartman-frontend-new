<script lang="ts">
	// SVELTE
	import { onMount } from 'svelte';

	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useConvexClient } from 'convex-svelte';

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

	// UTILS
	import { safeQuery } from '@/utils/convexHelpers';

	// TYPES
	import type { HostDashboardStats } from '@/convex/pages/host/dashboard/types/hostDashboardTypes';

	/**
	 * Band order (HostSystemDesign.md §2): 1) pending strip, 2) earnings card, 3) today,
	 * 4) stat tiles. The trend chart and per-listing table live on `/host/analytics` (§2b).
	 *
	 * Two reads, deliberately different:
	 *   - the pending strip fetches itself and is a SUBSCRIPTION — requests arrive from
	 *     guests and the cron expires them while the host watches;
	 *   - everything else is this ONE-SHOT read, held here because the earnings card, the
	 *     today strip and the tiles all come from the same payload. Fetching per component
	 *     would fire the same query three times.
	 *
	 * Zero-listing visitors never get here — the host layout swaps in the become-host state
	 * for the whole area (HostSystemDesign.md §1).
	 */
	const convex = useConvexClient();

	let stats = $state<HostDashboardStats | undefined>();
	let loadingStats = $state(false);
	let errorStats = $state(false);

	onMount(async () => {
		loadingStats = true;

		const payload = await safeQuery(
			convex,
			api.pages.host.dashboard.queries.fetchHostDashboardStats.fetchHostDashboardStats,
			{}
		);
		if (payload) stats = payload;
		else errorStats = true;

		loadingStats = false;
	});
</script>

<SvelteHead title="Dashboard" description="Your accommodations at a glance." noIndex />

<section class="flex w-full flex-col gap-6 p-4 md:p-6">
	<HostDashboardHeader />

	<HostDashboardPendingReservations />

	{#if errorStats}
		<ErrorComponent
			variant="alert"
			title="Couldn't load dashboard"
			description="Something went wrong while loading your dashboard. Please try again."
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
