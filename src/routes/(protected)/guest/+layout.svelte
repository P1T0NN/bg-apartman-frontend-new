<script lang="ts">
	// CLASSES
	import { authClass } from '@/features/auth/classes/authClass.svelte';

	// CONFIG
	import {
		ADMIN_PAGE_ENDPOINTS,
		PROTECTED_PAGE_ENDPOINTS,
		UNPROTECTED_PAGE_ENDPOINTS
	} from '@/config/routeEndpoints.js';

	// COMPONENTS
	import * as Sidebar from '@/components/ui/sidebar/index.js';
	import AppSidebar from '@/components/ui/app-sidebar/app-sidebar.svelte';
	import SiteHeader from '@/components/ui/app-sidebar/site-header.svelte';

	// TYPES
	import type { AppSidebarNavItems } from '@/components/ui/app-sidebar/types.js';

	// LUCIDE ICONS
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import CalendarCheckIcon from '@lucide/svelte/icons/calendar-check';
	import HeartIcon from '@lucide/svelte/icons/heart';
	import SearchIcon from '@lucide/svelte/icons/search';
	import StoreIcon from '@lucide/svelte/icons/store';
	import ShieldIcon from '@lucide/svelte/icons/shield';

	let { children } = $props();

	// Non-hosts see a "Become a host" CTA; existing hosts see "Switch to hosting".
	const isHost = $derived(authClass.currentUser?.isHost === true);

	// Admins only — the sidebar entry is UX; every admin function re-checks the role server-side.
	const isAdmin = $derived(authClass.currentUser?.role === 'admin');

	const navItems = $derived<AppSidebarNavItems>({
		navMain: [
			{
				items: [
					{
						name: 'Dashboard',
						url: PROTECTED_PAGE_ENDPOINTS.GUEST_DASHBOARD,
						icon: LayoutDashboardIcon
					},
					{
						name: 'My bookings',
						url: PROTECTED_PAGE_ENDPOINTS.GUEST_MY_BOOKINGS,
						icon: CalendarCheckIcon
					},
					{ name: 'Saved', url: PROTECTED_PAGE_ENDPOINTS.GUEST_FAVORITES, icon: HeartIcon }
				]
			}
		],
		navSecondary: [
			{ name: 'Browse stays', url: UNPROTECTED_PAGE_ENDPOINTS.ROOT, icon: SearchIcon },
			{
				name: isHost ? 'Switch to hosting' : 'Become a host',
				url: PROTECTED_PAGE_ENDPOINTS.HOST_DASHBOARD,
				icon: StoreIcon,
				highlight: true
			},
			...(isAdmin
				? [{ name: 'Admin Page', url: ADMIN_PAGE_ENDPOINTS.DASHBOARD, icon: ShieldIcon }]
				: [])
		]
	});
</script>

<Sidebar.Provider
	style="--sidebar-width: calc(var(--spacing) * 72); --header-height: calc(var(--spacing) * 12);"
>
	<AppSidebar variant="inset" {navItems} />

	<Sidebar.Inset>
		<SiteHeader hidePaths={['/guest']} />

		<div class="flex min-h-0 flex-1 flex-col">
			{@render children()}
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>
