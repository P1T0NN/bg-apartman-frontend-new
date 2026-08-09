<script lang="ts">
	// SVELTEKIT
	import { page } from '$app/state';

	// CLASSES
	import { authClass } from '@/features/auth/classes/authClass.svelte';

	// CONFIG
	import { ADMIN_PAGE_ENDPOINTS, PROTECTED_PAGE_ENDPOINTS } from '@/config/routeEndpoints.js';

	// COMPONENTS
	import * as Sidebar from '@/components/ui/sidebar/index.js';
	import AppSidebar from '@/components/ui/app-sidebar/app-sidebar.svelte';
	import SiteHeader from '@/components/ui/app-sidebar/site-header.svelte';
	import BecomeHostState from '@/components/pages/(protected)/host/become-host-state.svelte';

	// TYPES
	import type { AppSidebarNavItems } from '@/components/ui/app-sidebar/types.js';

	// LUCIDE ICONS
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import ChartLineIcon from '@lucide/svelte/icons/chart-line';
	import BuildingIcon from '@lucide/svelte/icons/building';
	import CalendarCheckIcon from '@lucide/svelte/icons/calendar-check';
	import LuggageIcon from '@lucide/svelte/icons/luggage';
	import CirclePlusIcon from '@lucide/svelte/icons/circle-plus';
	import ShieldIcon from '@lucide/svelte/icons/shield';

	let { children } = $props();

	// Zero listings ⇒ the become-host screen instead of empty host surfaces, for every
	// `/host/**` page (HostSystemDesign.md §1) — except the add-listing form itself, which is
	// what the CTA points at. `isHost` stays a derivation (owns ≥ 1 listing), never a role.
	// While the user query is still in flight the pages render their own skeletons.
	const showBecomeHost = $derived(
		authClass.currentUser?.isHost === false &&
			page.url.pathname !== PROTECTED_PAGE_ENDPOINTS.ADD_ACCOMMODATION
	);

	const navItems = $derived.by((): AppSidebarNavItems => {
		// The primary host action is a pinned CTA, not a nav row — the same treatment the guest
		// sidebar gives "Become a host" (guest/+layout.svelte). Outline-primary via `highlight`;
		// nav-secondary.svelte renders it, nav-main never sees it.
		const navSecondary = [
			{
				name: 'Add Accommodation',
				url: PROTECTED_PAGE_ENDPOINTS.ADD_ACCOMMODATION,
				icon: CirclePlusIcon,
				highlight: true
			},
			{
				name: 'Switch to traveling',
				url: PROTECTED_PAGE_ENDPOINTS.GUEST_DASHBOARD,
				icon: LuggageIcon
			}
		];

		// Admins only — the sidebar entry is UX; every admin function re-checks the role server-side.
		if (authClass.currentUser?.role === 'admin') {
			navSecondary.push({
				name: 'Admin Page',
				url: ADMIN_PAGE_ENDPOINTS.DASHBOARD,
				icon: ShieldIcon
			});
		}

		return {
			navMain: [
				{
					label: 'Overview',
					items: [
						{
							name: 'Dashboard',
							url: PROTECTED_PAGE_ENDPOINTS.HOST_DASHBOARD,
							icon: LayoutDashboardIcon
						},
						{
							name: 'Reservations',
							url: PROTECTED_PAGE_ENDPOINTS.RESERVATIONS,
							icon: CalendarCheckIcon
						}
					]
				},
				{
					label: 'Accommodations',
					items: [
						{
							name: 'My Accommodations',
							url: PROTECTED_PAGE_ENDPOINTS.MY_ACCOMMODATIONS,
							icon: BuildingIcon
						}
					]
				},
				{
					label: 'Analytics',
					items: [
						// Performance depth lives here, not on the dashboard — a page a host
						// opens on purpose, so its heavy reads run only then (HSD §2b).
						{
							name: 'Analytics',
							url: PROTECTED_PAGE_ENDPOINTS.HOST_ANALYTICS,
							icon: ChartLineIcon
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
			{#if showBecomeHost}
				<div class="p-4 md:p-6">
					<BecomeHostState />
				</div>
			{:else}
				{@render children()}
			{/if}
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>
