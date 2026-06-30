<script lang="ts">
	// SVELTEKIT IMPORTS
	import { page } from '$app/state';

	// CLASSES
	import { authClass } from '@/features/auth/classes/authClass.svelte';

	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';

	// CONFIG
	import {
		ADMIN_PAGE_ENDPOINTS,
		PROTECTED_PAGE_ENDPOINTS,
		UNPROTECTED_PAGE_ENDPOINTS
	} from '@/shared/routeEndpoints.js';

	// COMPONENTS
	import * as Sidebar from '@/shared/components/ui/sidebar/index.js';
	import AppSidebar from '@/shared/components/ui/app-sidebar/app-sidebar.svelte';
	import SiteHeader from '@/shared/components/ui/app-sidebar/site-header.svelte';

	// UTILS
	import { deLocalizeUrl } from '@/shared/lib/paraglide/runtime';

	// TYPES
	import type { AppSidebarNavItems } from '@/shared/components/ui/app-sidebar/types.js';

	// LUCIDE ICONS
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import BuildingIcon from '@lucide/svelte/icons/building';
	import CalendarCheckIcon from '@lucide/svelte/icons/calendar-check';
	import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
	import HomeIcon from '@lucide/svelte/icons/home';
	import CirclePlusIcon from '@lucide/svelte/icons/circle-plus';

	let { children } = $props();

	const pathnameLogical = $derived(deLocalizeUrl(page.url).pathname);
	const isAdminRoute = $derived(
		pathnameLogical === '/admin' || pathnameLogical.startsWith('/admin/')
	);
	// Guest routes carry their own sidebar shell (src/routes/(protected)/guest/+layout.svelte),
	// so the host shell below skips them — same delegation as the admin shell.
	const isGuestRoute = $derived(
		pathnameLogical === '/guest' || pathnameLogical.startsWith('/guest/')
	);
	const isAdmin = $derived(authClass.currentUser?.role === 'admin');

	const navItems = $derived.by((): AppSidebarNavItems => {
		const navSecondary = [
			...(isAdmin
				? [
						{
							name: m['ProtectedSidebar.goToAdminPage'](),
							url: ADMIN_PAGE_ENDPOINTS.DASHBOARD,
							icon: ShieldCheckIcon
						}
					]
				: []),
			{
				name: m['ProtectedSidebar.backToHome'](),
				url: UNPROTECTED_PAGE_ENDPOINTS.ROOT,
				icon: HomeIcon
			}
		];

		return {
			navMain: [
				{
					name: m['ProtectedSidebar.dashboard'](),
					url: PROTECTED_PAGE_ENDPOINTS.DASHBOARD,
					icon: LayoutDashboardIcon
				},
				{
					name: m['ProtectedSidebar.myAccommodations'](),
					url: PROTECTED_PAGE_ENDPOINTS.MY_ACCOMMODATIONS,
					icon: BuildingIcon
				},
				{
					name: m['ProtectedSidebar.addAccommodation'](),
					url: PROTECTED_PAGE_ENDPOINTS.ADD_ACCOMMODATION,
					icon: CirclePlusIcon
				},
				{
					name: m['ProtectedSidebar.reservations'](),
					url: PROTECTED_PAGE_ENDPOINTS.RESERVATIONS,
					icon: CalendarCheckIcon
				}
			],
			navSecondary
		};
	});
</script>

{#if isAdminRoute || isGuestRoute}
	{@render children()}
{:else}
	<Sidebar.Provider
		style="--sidebar-width: calc(var(--spacing) * 72); --header-height: calc(var(--spacing) * 12);"
		class="protected-shell"
	>
		<AppSidebar variant="inset" {navItems} />

		<Sidebar.Inset>
			<SiteHeader hidePaths={['/host']} />

			<div class="flex min-h-0 flex-1 flex-col px-4">
				{@render children()}
			</div>
		</Sidebar.Inset>
	</Sidebar.Provider>
{/if}
