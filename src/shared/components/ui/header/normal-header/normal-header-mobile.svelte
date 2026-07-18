<script lang="ts">
	// SVELTEKIT
	import { page } from '$app/state';

	// LIBRARIES
	import { deLocalizeUrl } from '@/shared/lib/paraglide/runtime';
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';

	// CLASSES
	import { authClass } from '@/features/auth/classes/authClass.svelte';

	// CONFIG
	import { COMPANY_DATA } from '@/shared/constants.js';
	import { PROTECTED_PAGE_ENDPOINTS, UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/routeEndpoints.js';

	// CLASSES
	import {
		isHeaderItemActive,
		normalHeader,
		navItems,
		navLinkActiveClass,
		navLinkClass
	} from './normal-header.svelte.ts';

	// COMPONENTS
	import Button from '@/shared/components/ui/button/button.svelte';
	import Link from '@/shared/components/ui/link/link.svelte';
	import Logo from '@/shared/components/ui/logo/logo.svelte';
	import LanguageSelector from '@/shared/components/ui/language-selector/language-selector.svelte';
	import LogoutButton from '@/features/auth/components/logout-button/logout-button.svelte';
	import { NativeDrawer } from '@/shared/components/ui/native-drawer/index.js';
	import { Separator } from '@/shared/components/ui/separator';
	import { localizeHref } from '@/shared/lib/paraglide/runtime';
	import { m } from '@/shared/lib/paraglide/messages';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// LUCIDE ICONS
	import MenuIcon from '@lucide/svelte/icons/menu';
	import XIcon from '@lucide/svelte/icons/x';
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import StoreIcon from '@lucide/svelte/icons/store';

	let { hasLogo = true }: { hasLogo?: boolean } = $props();

	const auth = useAuth();
	const isAuthenticated = $derived(auth.isAuthenticated);
	const isHost = $derived(authClass.currentUser?.isHost === true);

	const pathnameLogical = $derived(new URL(deLocalizeUrl(page.url.href)).pathname);
</script>

<NativeDrawer
	bind:open={normalHeader.menuOpen}
	direction="right"
	title="Menu"
	class="flex h-full max-h-dvh w-full max-w-80 flex-col gap-4 overflow-x-hidden overflow-y-auto border-hero-overlay-foreground/10 bg-dark-elevated p-4 text-dark-elevated-foreground"
>
	{#snippet trigger({ props })}
		<button
			{...props}
			class="flex size-10 touch-manipulation items-center justify-center rounded-full bg-hero-overlay-foreground/10 text-hero-overlay-foreground transition-colors outline-none hover:bg-hero-overlay-foreground/20 focus-visible:ring-[3px] focus-visible:ring-hero-overlay-foreground/40 lg:hidden"
			aria-label={normalHeader.menuOpen ? 'Close menu' : 'Open menu'}
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
					<Logo size="sm" onclick={normalHeader.closeMenu} />
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
				aria-label="Close menu"
				onclick={close}
			>
				<XIcon class="size-5" />
			</Button>
		</div>

		<nav aria-label="Mobile main">
			<ul class="flex flex-col gap-1">
				{#each navItems as item, i (item.href)}
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
			<div class="self-start">
				<LanguageSelector variant="header" />
			</div>

			<Separator class="bg-hero-overlay-foreground/10" />

			<div class="sm:hidden">
				{#if isAuthenticated}
					<div class="flex flex-col gap-2">
						<Button
							variant="outline"
							class="w-full justify-start border-hero-overlay-foreground/20 bg-hero-overlay-foreground/10 text-dark-elevated-foreground hover:bg-hero-overlay-foreground/20 hover:text-dark-elevated-foreground"
							href={localizeHref(PROTECTED_PAGE_ENDPOINTS.GUEST_DASHBOARD)}
							onclick={normalHeader.closeMenu}
						>
							<LayoutDashboardIcon />
							{m['Header.guestDashboard']()}
						</Button>

						<Button
							variant="outline"
							class="w-full justify-start border-hero-overlay-foreground/20 bg-hero-overlay-foreground/10 text-dark-elevated-foreground hover:bg-hero-overlay-foreground/20 hover:text-dark-elevated-foreground"
							href={localizeHref(PROTECTED_PAGE_ENDPOINTS.HOST_DASHBOARD)}
							onclick={normalHeader.closeMenu}
						>
							<StoreIcon />
							{isHost ? m['Header.switchToHosting']() : m['Header.becomeAHost']()}
						</Button>
						<LogoutButton class="w-full" />
					</div>
				{:else}
					<Link
						href={localizeHref(UNPROTECTED_PAGE_ENDPOINTS.LOGIN)}
						class="block w-full rounded-md bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground transition-all hover:opacity-90"
						onclick={normalHeader.closeMenu}
					>
						{m['LoginButton.login']()}
					</Link>
				{/if}
			</div>
		</div>
	{/snippet}
</NativeDrawer>
