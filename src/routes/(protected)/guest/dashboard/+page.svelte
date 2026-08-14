<script lang="ts">
	// I18N
	import { m } from '@/paraglide/messages';

	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useQuery } from 'convex-svelte';

	// CLASSES
	import { favoritesClass } from '@/features/favorites/classes/favoritesClass.svelte';

	// COMPONENTS
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import DashboardHeader from '@/components/pages/(protected)/guest/dashboard/dashboard-header.svelte';
	import DashboardPageLoading from '@/components/pages/(protected)/guest/dashboard/loading/dashboard-page-loading.svelte';
	import { ErrorComponent } from '@/components/ui/error-component/index.js';
	import DashboardNextTrip from '@/components/pages/(protected)/guest/dashboard/dashboard-next-trip/dashboard-next-trip.svelte';
	import DashboardNextTripEmpty from '@/components/pages/(protected)/guest/dashboard/empty/dashboard-next-trip-empty.svelte';
	import DashboardShortcuts from '@/components/pages/(protected)/guest/dashboard/dashboard-shortcuts.svelte';
	import DashboardUpcoming from '@/components/pages/(protected)/guest/dashboard/dashboard-upcoming/dashboard-upcoming.svelte';

	// UTILS
	import { countdownLabel } from '@/utils/formatters';

	// TYPES
	import type { GuestDashboardData } from '@/convex/pages/guest/dashboard/types/guestDashboardTypes';

	const dashboardQuery = useQuery(
		api.pages.guest.dashboard.queries.fetchGuestDashboardPageSafe.fetchGuestDashboardPageSafe,
		() => ({})
	);
	const data = $derived(dashboardQuery.data as GuestDashboardData | null | undefined);
	const isLoading = $derived(data === undefined && !dashboardQuery.error);

	$effect(() => {
		favoritesClass.hydrate();
	});
	const savedCount = $derived(favoritesClass.ids.size);

	const nextTrip = $derived(data?.nextTrip ?? null);
	const moreUpcoming = $derived(data?.moreUpcoming ?? []);

	const subtitle = $derived(
		nextTrip
			? m['GuestDashboardPage.nextStay']({ countdown: countdownLabel(nextTrip.checkInDate).toLowerCase() })
			: m['GuestDashboardPage.noTripsBooked']()
	);
</script>

<SvelteHead title={m['GuestDashboardPage.SEO.title']()} description={m['GuestDashboardPage.SEO.description']()} noIndex />

<section class="flex w-full flex-col gap-6 p-4 md:p-6">
	{#if isLoading}
		<DashboardPageLoading />
	{:else if dashboardQuery.error}
		<ErrorComponent
			variant="alert"
			title={m['GuestDashboardPage.loadDashboardErrorTitle']()}
			description={m['GuestDashboardPage.loadDashboardErrorDescription']()}
		/>
	{:else}
		<DashboardHeader {subtitle} />

		<DashboardShortcuts
			upcomingCount={data?.counts.upcoming ?? 0}
			checkedOutCount={data?.counts.checkedOut ?? 0}
			{savedCount}
		/>

		{#if nextTrip}
			<DashboardNextTrip trip={nextTrip} />
		{:else}
			<DashboardNextTripEmpty />
		{/if}

		<DashboardUpcoming trips={moreUpcoming} />
	{/if}
</section>
