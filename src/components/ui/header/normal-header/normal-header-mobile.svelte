<script lang="ts">
	// SVELTEKIT
	import { page } from '$app/state';

	// LIBRARIES
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';

	// CLASSES
	import { authClass } from '@/features/auth/classes/authClass.svelte';

	// CONFIG
	import { COMPANY_DATA } from '@/shared/config.js';
	import { PROTECTED_PAGE_ENDPOINTS, UNPROTECTED_PAGE_ENDPOINTS } from '@/config/routeEndpoints.js';

	// I18N
	import { deLocalizeHref } from '@/paraglide/runtime';
	import { m } from '@/paraglide/messages';

	// CLASSES
	import {
		isHeaderItemActive,
		normalHeader,
		navItems,
		navLinkActiveClass,
		navLinkClass
	} from './normal-header.svelte.ts';

	// COMPONENTS
	import Button from '@/components/ui/button/button.svelte';
	import Link from '@/components/ui/link/link.svelte';
	import Logo from '@/components/ui/logo/logo.svelte';
	import LogoutButton from '@/features/auth/components/logout-button/logout-button.svelte';
	import { NativeDrawer } from '@/components/ui/native-drawer/index.js';
	import { Separator } from '@/components/ui/separator';

	// UTILS
	import { cn } from '@/utils/utils.js';
	import { appHref } from '@/utils/app-navigation.js';

	// LUCIDE ICONS
	import MenuIcon from '@lucide/svelte/icons/menu';
	import XIcon from '@lucide/svelte/icons/x';
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import StoreIcon from '@lucide/svelte/icons/store';

	let { hasLogo = true }: { hasLogo?: boolean } = $props();

	const auth = useAuth();
	const isAuthenticated = $derived(auth.isAuthenticated);
	const isHost = $derived(authClass.currentUser?.isHost === true);

	// De-localize like the desktop header: /sr/... must compare against canonical app paths.
	const pathnameLogical = $derived(deLocalizeHref(new URL(page.url.href).pathname));
</script>

<NativeDrawer
	bind:open={normalHeader.menuOpen}
	direction="right"
	title={m['Header.NormalHeaderMobile.menu']()}
	class="flex h-full max-h-dvh w-full max-w-80 flex-col gap-4 overflow-x-hidden overflow-y-auto border-hero-overlay-foreground/10 bg-dark-elevated p-4 text-dark-elevated-foreground"
>
	{#snippet trigger({ props })}
		<button
			{...props}
			class="flex size-10 touch-manipulation items-center justify-center rounded-full bg-hero-overlay-foreground/10 text-hero-overlay-foreground transition-colors outline-none hover:bg-hero-overlay-foreground/20 focus-visible:ring-[3px] focus-visible:ring-hero-overlay-foreground/40 lg:hidden"
			aria-label={normalHeader.menuOpen
				? m['Header.NormalHeaderMobile.closeMenu']()
				: m['Header.NormalHeaderMobile.openMenu']()}
		>
			{#if normalHeader.menuOpen}
				<XIcon class="size-5" />
			{:else}
				<MenuIcon class="size-5" />
			{/if}
		</button>
	{/snippet}

	{#snippet children({ close })}
		<div class="flex min-w-0 items-center justify-between gap-2">
			<div class="min-w-0">
				{#if hasLogo}
					<Logo
						size="sm"
						onclick={normalHeader.closeMenu}
						href={appHref(UNPROTECTED_PAGE_ENDPOINTS.ROOT)}
					/>
				{:else}
					<span class="truncate text-sm font-semibold text-dark-elevated-foreground">
						{COMPANY_DATA.NAME}
					</span>
				{/if}
			</div>

			<Button
				type="button"
				variant="ghost"
				size="icon"
				class="shrink-0 touch-manipulation text-dark-elevated-foreground hover:bg-hero-overlay-foreground/10 hover:text-dark-elevated-foreground"
				aria-label={m['Header.NormalHeaderMobile.closeMenu']()}
				onclick={close}
			>
				<XIcon class="size-5" />
			</Button>
		</div>

		<nav aria-label={m['Header.NormalHeaderMobile.mobileMain']()}>
			<ul class="flex flex-col gap-1">
				{#each navItems() as item, i (item.href)}
					{@const active = isHeaderItemActive(pathnameLogical, item)}
					<li>
						<Link
							id={i === 0 ? 'site-mobile-nav-first' : undefined}
							href={item.href}
							class={cn(navLinkClass, 'block w-full', active && navLinkActiveClass)}
							aria-current={active ? (item.sectionId ? 'location' : 'page') : undefined}
							onclick={normalHeader.closeMenu}
						>
							{item.label}
						</Link>
					</li>
				{/each}
			</ul>
		</nav>

		<div class="mt-auto flex flex-col gap-3">
			<Separator class="bg-hero-overlay-foreground/10" />

			<div class="sm:hidden">
				{#if isAuthenticated}
					<div class="flex flex-col gap-2">
						<Button
							variant="outline"
							class="w-full justify-start border-hero-overlay-foreground/20 bg-hero-overlay-foreground/10 text-dark-elevated-foreground hover:bg-hero-overlay-foreground/20 hover:text-dark-elevated-foreground"
							href={appHref(PROTECTED_PAGE_ENDPOINTS.GUEST_DASHBOARD)}
							onclick={normalHeader.closeMenu}
						>
							<LayoutDashboardIcon />
							{m['Header.NormalHeaderMobile.guestDashboard']()}
						</Button>

						<Button
							variant="outline"
							class="w-full justify-start border-hero-overlay-foreground/20 bg-hero-overlay-foreground/10 text-dark-elevated-foreground hover:bg-hero-overlay-foreground/20 hover:text-dark-elevated-foreground"
							href={appHref(PROTECTED_PAGE_ENDPOINTS.HOST_DASHBOARD)}
							onclick={normalHeader.closeMenu}
						>
							<StoreIcon />
							{isHost
								? m['Header.NormalHeaderMobile.switchToHosting']()
								: m['Header.NormalHeaderMobile.becomeAHost']()}
						</Button>
						<LogoutButton class="w-full" />
					</div>
				{:else}
					<Link
						href={appHref(UNPROTECTED_PAGE_ENDPOINTS.LOGIN)}
						class="block w-full rounded-md bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground transition-all hover:opacity-90"
						onclick={normalHeader.closeMenu}
					>
						{m['Header.NormalHeaderMobile.login']()}
					</Link>
				{/if}
			</div>
		</div>
	{/snippet}
</NativeDrawer>
