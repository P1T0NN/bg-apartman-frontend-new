<script lang="ts">
	// CONFIG
	import { ADMIN_PAGE_ENDPOINTS } from '@/shared/constants.js';

	// COMPONENTS
	import * as Sidebar from '@/shared/components/ui/sidebar/index.js';
	import AppSidebar from '@/shared/components/ui/app-sidebar/app-sidebar.svelte';
	import SiteHeader from '@/shared/components/ui/app-sidebar/site-header.svelte';

	// TYPES
	import type { AppSidebarNavItems } from '@/shared/components/ui/app-sidebar/types.js';

	// LUCIDE ICONS
	import FrameIcon from '@lucide/svelte/icons/frame';
	import PieChartIcon from '@lucide/svelte/icons/pie-chart';

	let { children } = $props();

	const navItems: AppSidebarNavItems = {
		navMain: [
			{
				name: 'Dashboard',
				url: ADMIN_PAGE_ENDPOINTS.DASHBOARD,
				icon: FrameIcon
			},
			{
				name: 'Users',
				url: ADMIN_PAGE_ENDPOINTS.USERS,
				icon: PieChartIcon
			},
		]
	};
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
