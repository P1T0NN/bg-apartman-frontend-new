<script lang="ts">
	// SVELTEKIT IMPORTS
	import { page } from '$app/state';

	// CONFIG
	import { COMPANY_DATA } from '@/shared/config.js';
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/config/routeEndpoints.js';

	// COMPONENTS
	import * as Sidebar from '@/components/ui/sidebar/index.js';
	import NavMain from './nav-main.svelte';
	import NavSecondary from './nav-secondary.svelte';
	import NavUser from './nav-user.svelte';
	import Logo from '@/components/ui/logo/logo.svelte';

	// UTILS
	import { appHref } from '@/utils/app-navigation.js';

	// UTILS
	import { isNavItemActive } from '@/utils/isNavItemActive.js';

	// TYPES
	import type { ComponentProps } from 'svelte';
	import type { AppSidebarNavItems } from './types.js';

	let {
		hasLogo = true,
		navItems,
		ref = $bindable(null),
		...restProps
	}: {
		hasLogo?: boolean;
		navItems: AppSidebarNavItems;
	} & ComponentProps<typeof Sidebar.Root> = $props();

	const pathnameLogical = $derived(new URL(page.url.href).pathname);

	const navMainGroups = $derived(
		navItems.navMain.map((group) => ({
			label: group.label,
			items: group.items.map((item) => ({
				...item,
				isActive: isNavItemActive(pathnameLogical, item.url)
			}))
		}))
	);

	const navSecondaryItems = $derived(
		navItems.navSecondary?.map((item) => ({
			...item,
			isActive: isNavItemActive(pathnameLogical, item.url)
		}))
	);
</script>

<Sidebar.Root bind:ref class="pt-4" {...restProps}>
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				{#if hasLogo}
					<Logo class="size-5!" href={appHref(UNPROTECTED_PAGE_ENDPOINTS.ROOT)} />
				{:else}
					<span class="truncate px-2 text-base font-semibold text-sidebar-foreground">
						{COMPANY_DATA.NAME}
					</span>
				{/if}
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>

	<Sidebar.Content>
		<NavMain groups={navMainGroups} />
		{#if navSecondaryItems}
			<NavSecondary items={navSecondaryItems} class="mt-auto" />
		{/if}
	</Sidebar.Content>

	<Sidebar.Footer>
		<NavUser />
	</Sidebar.Footer>
</Sidebar.Root>
