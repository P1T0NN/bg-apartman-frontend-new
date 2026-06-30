<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useQuery } from 'convex-svelte';

	// CLASSES
	import { favoritesClass } from '@/features/favorites/classes/favoritesClass.svelte';

	// COMPONENTS
	import SvelteHead from '@/shared/components/ui/svelte-head/svelte-head.svelte';
	import DashboardHeader from '@/shared/components/pages/(protected)/guest/dashboard/dashboard-header.svelte';
	import DashboardPageLoading from '@/shared/components/pages/(protected)/guest/dashboard/loading/dashboard-page-loading.svelte';
	import DashboardPageError from '@/shared/components/pages/(protected)/guest/dashboard/error/dashboard-page-error.svelte';
	import DashboardNextTrip from '@/shared/components/pages/(protected)/guest/dashboard/dashboard-next-trip/dashboard-next-trip.svelte';
	import DashboardNextTripEmpty from '@/shared/components/pages/(protected)/guest/dashboard/empty/dashboard-next-trip-empty.svelte';
	import DashboardShortcuts from '@/shared/components/pages/(protected)/guest/dashboard/dashboard-shortcuts.svelte';
	import DashboardUpcoming from '@/shared/components/pages/(protected)/guest/dashboard/dashboard-upcoming/dashboard-upcoming.svelte';

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
			? `Your next stay is ${countdownLabel(nextTrip.checkInDate).toLowerCase()}.`
			: "No trips booked yet — let's find your next one."
	);
</script>

<SvelteHead title="Guest dashboard" description="Your trips at a glance." noIndex />

<section class="flex w-full flex-col gap-6 p-4 md:p-6">
	{#if isLoading}
		<DashboardPageLoading />
	{:else if dashboardQuery.error}
		<DashboardPageError />
	{:else}
		<DashboardHeader {subtitle} />

		{#if nextTrip}
			<DashboardNextTrip trip={nextTrip} />
		{:else}
			<DashboardNextTripEmpty />
		{/if}

		<DashboardShortcuts
			upcomingCount={data?.counts.upcoming ?? 0}
			checkedOutCount={data?.counts.checkedOut ?? 0}
			{savedCount}
		/>

		<DashboardUpcoming trips={moreUpcoming} />
	{/if}
</section>
