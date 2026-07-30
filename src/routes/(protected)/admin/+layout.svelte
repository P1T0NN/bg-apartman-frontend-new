<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useQuery } from 'convex-svelte';

	// CONFIG
	import { ADMIN_PAGE_ENDPOINTS, PROTECTED_PAGE_ENDPOINTS } from '@/config/routeEndpoints.js';

	// COMPONENTS
	import * as Sidebar from '@/components/ui/sidebar/index.js';
	import AppSidebar from '@/components/ui/app-sidebar/app-sidebar.svelte';
	import SiteHeader from '@/components/ui/app-sidebar/site-header.svelte';

	// TYPES
	import type { AppSidebarNavItems } from '@/components/ui/app-sidebar/types.js';

	// LUCIDE ICONS
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import UsersIcon from '@lucide/svelte/icons/users';
	import Building2Icon from '@lucide/svelte/icons/building-2';
	import CalendarDaysIcon from '@lucide/svelte/icons/calendar-days';
	import MessageSquareWarningIcon from '@lucide/svelte/icons/message-square-warning';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';

	let { children } = $props();

	// Subscription, justified (GeneralSystemDesignRule.md): hosts submit listings and the
	// public files reports while the admin works — a stale badge would send them to a page
	// that needs nothing, or worse, leave real work invisible (APSD §1). Two aggregate
	// counts, so a re-run is O(log n).
	const badges = useQuery(
		api.pages.admin.queries.fetchAdminSidebarBadgesSafe.fetchAdminSidebarBadgesSafe,
		() => ({})
	);

	/** Number at 1–99, `99+` above, nothing at zero — absence means done (APSD §1). */
	function badgeFor(count: number | undefined): string | undefined {
		if (!count) return undefined;
		return count > 99 ? '99+' : String(count);
	}

	const navItems: AppSidebarNavItems = $derived({
		navMain: [
			{
				label: 'General',
				items: [
					{ name: 'Dashboard', url: ADMIN_PAGE_ENDPOINTS.DASHBOARD, icon: LayoutDashboardIcon },
					{ name: 'Users', url: ADMIN_PAGE_ENDPOINTS.USERS, icon: UsersIcon }
				]
			},
			{
				label: 'Accommodations',
				items: [
					{
						name: 'Accommodations',
						url: ADMIN_PAGE_ENDPOINTS.ACCOMMODATIONS,
						icon: Building2Icon,
						badge: badgeFor(badges.data?.pendingReview)
					},
					{ name: 'Bookings', url: ADMIN_PAGE_ENDPOINTS.BOOKINGS, icon: CalendarDaysIcon }
				]
			},
			{
				label: 'Feedback',
				items: [
					{
						name: 'Reports',
						url: ADMIN_PAGE_ENDPOINTS.REPORTS,
						icon: MessageSquareWarningIcon,
						badge: badgeFor(badges.data?.newReports)
					}
				]
			}
		],
		navSecondary: [
			{
				name: 'Back to User',
				url: PROTECTED_PAGE_ENDPOINTS.GUEST_DASHBOARD,
				icon: ArrowLeftIcon
			}
		]
	});
</script>

<Sidebar.Provider
	style="--sidebar-width: calc(var(--spacing) * 72); --header-height: calc(var(--spacing) * 12);"
>
	<AppSidebar variant="inset" {navItems} />

	<Sidebar.Inset>
		<SiteHeader hidePaths={['/admin']} />

		<div class="flex min-h-0 flex-1 flex-col">
			{@render children()}
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>
