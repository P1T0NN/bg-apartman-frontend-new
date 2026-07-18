<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';

	// CONFIG
	import { PROTECTED_PAGE_ENDPOINTS } from '@/shared/routeEndpoints.js';

	// COMPONENTS
	import * as Sidebar from '@/shared/components/ui/sidebar/index.js';
	import AppSidebar from '@/shared/components/ui/app-sidebar/app-sidebar.svelte';
	import SiteHeader from '@/shared/components/ui/app-sidebar/site-header.svelte';

	// TYPES
	import type { AppSidebarNavItems } from '@/shared/components/ui/app-sidebar/types.js';

	// LUCIDE ICONS
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import BuildingIcon from '@lucide/svelte/icons/building';
	import CalendarCheckIcon from '@lucide/svelte/icons/calendar-check';
	import LuggageIcon from '@lucide/svelte/icons/luggage';
	import CirclePlusIcon from '@lucide/svelte/icons/circle-plus';

	let { children } = $props();

	const navItems = $derived.by((): AppSidebarNavItems => {
		const navSecondary = [
			{
				name: m['ProtectedSidebar.switchToTraveling'](),
				url: PROTECTED_PAGE_ENDPOINTS.GUEST_DASHBOARD,
				icon: LuggageIcon
			}
		];

		return {
			navMain: [
				{
					label: m['ProtectedSidebar.overview'](),
					items: [
						{
							name: m['ProtectedSidebar.dashboard'](),
							url: PROTECTED_PAGE_ENDPOINTS.HOST_DASHBOARD,
							icon: LayoutDashboardIcon
						},
						{
							name: m['ProtectedSidebar.reservations'](),
							url: PROTECTED_PAGE_ENDPOINTS.RESERVATIONS,
							icon: CalendarCheckIcon
						}
					]
				},
				{
					label: m['ProtectedSidebar.accommodations'](),
					items: [
						{
							name: m['ProtectedSidebar.myAccommodations'](),
							url: PROTECTED_PAGE_ENDPOINTS.MY_ACCOMMODATIONS,
							icon: BuildingIcon
						},
						{
							name: m['ProtectedSidebar.addAccommodation'](),
							url: PROTECTED_PAGE_ENDPOINTS.ADD_ACCOMMODATION,
							icon: CirclePlusIcon
						}
					]
				}
			],
			navSecondary
		};
	});
</script>

<Sidebar.Provider
	style="--sidebar-width: calc(var(--spacing) * 72); --header-height: calc(var(--spacing) * 12);"
>
	<AppSidebar variant="inset" {navItems} />

	<Sidebar.Inset>
		<SiteHeader hidePaths={['/host']} />

		<div class="flex min-h-0 flex-1 flex-col px-4">
			{@render children()}
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>
