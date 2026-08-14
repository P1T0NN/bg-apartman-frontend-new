<script lang="ts">
	// SVELTEKIT
	import { page } from '$app/state';

	// LIBRARIES
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';

	// CONFIG
	import { COMPANY_DATA } from '@/shared/config.js';
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/config/routeEndpoints.js';

	// I18N
	import { deLocalizeHref } from '@/lib/paraglide/runtime';
	import { m } from '@/lib/paraglide/messages';

	// CLASSES
	import {
		isHeaderItemActive,
		navItems,
		navLinkActiveClass,
		navLinkClass,
		sectionSpy,
		spiedSectionIds
	} from './normal-header.svelte.ts';

	// COMPONENTS
	import Link from '@/components/ui/link/link.svelte';
	import Button from '@/components/ui/button/button.svelte';
	import Logo from '@/components/ui/logo/logo.svelte';
	import NormalHeaderAuthActions from './normal-header-auth-actions.svelte';
	import NormalHeaderMobile from './normal-header-mobile.svelte';
	import LanguageSelector from '@/components/ui/language-selector/language-selector.svelte';

	// UTILS
	import { cn } from '@/utils/utils.js';
	import { appHref } from '@/utils/app-navigation.js';

	type Props = {
		class?: string;
		/** Pin the bar under the viewport top while scrolling. */
		isSticky?: boolean;
		/**
		 * Use a clear bar over heroes. When `changeBgOnScroll` is true, the bar
		 * stays clear at the top of the page and picks up the solid surface after scroll.
		 */
		isTransparent?: boolean;
		/** Only used when `isTransparent` is true: solid frosted bar after leaving the top. */
		changeBgOnScroll?: boolean;
		/** Show [`Logo`](@/components/ui/logo/logo.svelte); if false, use the company name link. */
		hasLogo?: boolean;
	};

	let {
		class: className,
		isSticky = true,
		isTransparent = false,
		changeBgOnScroll = false,
		hasLogo = true
	}: Props = $props();

	const auth = useAuth();
	const isAuthenticated = $derived(auth.isAuthenticated);

	// Logical (de-localized) pathname: on /sr the raw URL is `/sr/...` but the nav items
	// compare against canonical app paths, so strip the locale prefix before matching.
	const pathnameLogical = $derived(deLocalizeHref(new URL(page.url.href).pathname));

	// Landing-page scroll-spy: observe the spied sections while on the root page.
	// Re-runs on navigation (pathname change); the returned cleanup disconnects the observer.
	$effect(() => {
		if (pathnameLogical !== UNPROTECTED_PAGE_ENDPOINTS.ROOT) return;
		return sectionSpy.observe(spiedSectionIds);
	});

	let scrolledPastTop = $state(false);

	$effect(() => {
		if (!isTransparent || !changeBgOnScroll) {
			scrolledPastTop = false;
			return;
		}

		const onScroll = () => {
			scrolledPastTop = window.scrollY > 8;
		};

		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	});

	const useSolidBar = $derived(!isTransparent || (changeBgOnScroll && scrolledPastTop));
</script>

<header
	class={cn(
		'z-50 w-full max-w-full overflow-x-clip transition-[background-color,backdrop-filter,border-color,box-shadow] duration-300 ease-out',
		isSticky ? 'sticky top-0' : 'relative',
		useSolidBar
			? 'border-b border-transparent bg-hero-overlay shadow-none'
			: 'border-b border-transparent bg-transparent shadow-none backdrop-blur-none',
		className
	)}
>
	<div class="mx-auto flex h-14 w-full max-w-7xl items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8">
		<div class="flex min-w-0 shrink items-center gap-2 lg:shrink-0">
			{#if hasLogo}
				<Logo href={appHref(UNPROTECTED_PAGE_ENDPOINTS.ROOT)} />
			{:else}
				<Link
					href={appHref(UNPROTECTED_PAGE_ENDPOINTS.ROOT)}
					class="truncate text-sm font-semibold tracking-tight text-hero-overlay-foreground sm:text-base"
				>
					{COMPANY_DATA.NAME}
				</Link>
			{/if}
		</div>

		<nav class="hidden min-w-0 flex-1 justify-center lg:flex" aria-label={m['Header.main']()}>
			<ul class="flex max-w-full min-w-0 flex-wrap items-center justify-center gap-1">
				{#each navItems() as item (item.href)}
					{@const active = isHeaderItemActive(pathnameLogical, item)}
					<li class="shrink-0">
						<Link
							href={item.href}
							class={cn(navLinkClass, active && navLinkActiveClass)}
							aria-current={active ? (item.sectionId ? 'location' : 'page') : undefined}
						>
							{item.label}
						</Link>
					</li>
				{/each}
			</ul>
		</nav>

		<div class="ml-auto flex shrink-0 items-center justify-end gap-1.5 sm:gap-2 lg:ml-0">
			<LanguageSelector />

			{#if isAuthenticated}
				<NormalHeaderAuthActions />
			{:else}
				<Button
					size="sm"
					class="hidden h-8 shrink-0 rounded-full px-3 text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 sm:inline-flex"
					href={appHref(UNPROTECTED_PAGE_ENDPOINTS.LOGIN)}
				>
					{m['Header.login']()}
				</Button>
			{/if}

			<NormalHeaderMobile {hasLogo} />
		</div>
	</div>
</header>
