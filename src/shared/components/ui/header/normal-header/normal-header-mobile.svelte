<script lang="ts">
	// SVELTEKIT
	import { page } from '$app/state';

	// LIBRARIES
	import { deLocalizeUrl } from '@/shared/lib/paraglide/runtime';
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';

	// CONFIG
	import { COMPANY_DATA } from '@/shared/constants.js';

	// CLASSES
	import {
		isNavItemActive,
		normalHeader,
		navItems,
		navLinkActiveClass,
		navLinkClass
	} from './normal-header.svelte.ts';

	// COMPONENTS
	import { buttonVariants } from '@/shared/components/ui/button/button.svelte';
	import Button from '@/shared/components/ui/button/button.svelte';
	import Link from '@/shared/components/ui/link/link.svelte';
	import Logo from '@/shared/components/ui/logo/logo.svelte';
	import LanguageSelector from '@/shared/components/ui/language-selector/language-selector.svelte';
	import LogoutButton from '@/features/auth/components/logout-button/logout-button.svelte';
	import { Drawer, DrawerClose, DrawerContent, DrawerTrigger } from '@/shared/components/ui/drawer';
	import { Separator } from '@/shared/components/ui/separator';
	import LoginButton from '@/features/auth/components/login-button/login-button.svelte';

	// UTILS
	import { cn } from '@/shared/utils/utils.js';

	// TYPES
	import type { ClassValue } from 'clsx';

	// LUCIDE ICONS
	import MenuIcon from '@lucide/svelte/icons/menu';
	import XIcon from '@lucide/svelte/icons/x';

	let { hasLogo = true }: { hasLogo?: boolean } = $props();

	const auth = useAuth();
	const isAuthenticated = $derived(auth.isAuthenticated);

	const pathnameLogical = $derived(new URL(deLocalizeUrl(page.url.href)).pathname);
</script>

<Drawer
	bind:open={normalHeader.menuOpen}
	direction="right"
	shouldScaleBackground={false}
>
	<DrawerTrigger>
		{#snippet child({ props })}
			<button
				{...props}
				type="button"
				class={cn(
					buttonVariants({ variant: 'ghost', size: 'icon' }),
					'lg:hidden touch-manipulation',
					props.class as ClassValue
				)}
				aria-label={normalHeader.menuOpen ? 'Close menu' : 'Open menu'}
			>
				{#if normalHeader.menuOpen}
					<XIcon class="size-5" />
				{:else}
					<MenuIcon class="size-5" />
				{/if}
			</button>
		{/snippet}
	</DrawerTrigger>

	<DrawerContent
		id="site-mobile-nav"
		aria-describedby={undefined}
		class="flex h-full max-h-dvh w-full max-w-80 flex-col gap-4 overflow-y-auto overflow-x-hidden border-border bg-background p-4 shadow-lg! data-[vaul-drawer-direction=right]:w-full sm:max-w-80"
	>
		<div class="flex min-w-0 items-center justify-between gap-2">
			<div class="min-w-0">
				{#if hasLogo}
					<Logo size="sm" onclick={normalHeader.closeMenu} />
				{:else}
					<span class="truncate text-sm font-semibold">{COMPANY_DATA.NAME}</span>
				{/if}
			</div>

			<DrawerClose>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					class="shrink-0 touch-manipulation"
					aria-label="Close menu"
				>
					<XIcon class="size-5" />
				</Button>
			</DrawerClose>
		</div>

		<nav aria-label="Mobile main">
			<ul class="flex flex-col gap-1">
				{#each navItems as item, i (item.href)}
					{@const active = isNavItemActive(pathnameLogical, item.href)}
					<li>
						<Link
							id={i === 0 ? 'site-mobile-nav-first' : undefined}
							href={item.href}
							class={cn(navLinkClass, 'block w-full', active && navLinkActiveClass)}
							aria-current={active ? 'page' : undefined}
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
				<LanguageSelector variant="default" />
			</div>

			<Separator />

			<div class="sm:hidden">
				{#if isAuthenticated}
					<LogoutButton />
				{:else}
					<LoginButton />
				{/if}
			</div>
		</div>
	</DrawerContent>
</Drawer>
