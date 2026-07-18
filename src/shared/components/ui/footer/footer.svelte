<script lang="ts">
	// CONFIG
	import { COMPANY_DATA } from '@/shared/constants.js';
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/routeEndpoints.js';

	// CLASSES
	import { footerLinkGroups } from './footer.svelte.ts';

	// COMPONENTS
	import Link from '@/shared/components/ui/link/link.svelte';
	import Logo from '@/shared/components/ui/logo/logo.svelte';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// SVGS
	import InstagramIcon from '@/svgs/instagram.svelte';
	import FacebookIcon from '@/svgs/facebook.svelte';
	import YoutubeIcon from '@/svgs/youtube.svelte';
	import TikTokIcon from '@/svgs/tiktok.svelte';

	type Props = {
		class?: string;
		/** Show [`Logo`](@/shared/components/ui/logo/logo.svelte); if false, use the company name wordmark. */
		hasLogo?: boolean;
		/** Render [`footerLinkGroups`](./footer.svelte.ts). */
		showNav?: boolean;
	};

	let { class: className, hasLogo = false, showNav = true }: Props = $props();

	const year = new Date().getFullYear();

	const socials = [
		{ icon: InstagramIcon, href: COMPANY_DATA.INSTAGRAM_URL, label: 'Instagram' },
		{ icon: FacebookIcon, href: COMPANY_DATA.FACEBOOK_URL, label: 'Facebook' },
		{ icon: TikTokIcon, href: COMPANY_DATA.TIKTOK_URL, label: 'TikTok' },
		{ icon: YoutubeIcon, href: COMPANY_DATA.YOUTUBE_URL, label: 'YouTube' }
	];

	const paymentMethods = ['VISA', 'MC', 'AMEX'];

	// Chip shared by social + payment badges — band-relative so it flips with the theme.
	const chipClass =
		'flex items-center justify-center rounded-full bg-background/10 text-background transition-colors';
</script>

<footer
	class={cn(
		'w-full max-w-full overflow-x-clip border-t-2 border-primary bg-foreground text-background',
		className
	)}
>
	<div class="mx-auto w-full max-w-7xl px-4 pt-16 sm:px-6 lg:px-8 lg:pt-20">
		<!-- Main -->
		<div class="grid gap-10 pb-12 sm:grid-cols-2 lg:grid-cols-6 lg:gap-8 lg:pb-16">
			<!-- Brand -->
			<div class="sm:col-span-2">
				{#if hasLogo}
					<Logo
						size="md"
						class="mb-4"
						imgClass="brightness-0 invert dark:brightness-100 dark:invert-0"
					/>
				{:else}
					<Link href={UNPROTECTED_PAGE_ENDPOINTS.ROOT} class="mb-4 inline-block">
						<span class="font-serif text-2xl font-bold text-background">
							{COMPANY_DATA.NAME}
						</span>
					</Link>
				{/if}

				<p class="mb-6 max-w-sm text-sm leading-relaxed text-background/60">
					{COMPANY_DATA.DESCRIPTION}
				</p>

				<!-- Social links -->
				<div class="flex gap-3">
					{#each socials as social (social.label)}
						<a
							href={social.href}
							target="_blank"
							rel="noopener noreferrer"
							aria-label={social.label}
							class={cn(chipClass, 'h-10 w-10 hover:bg-primary hover:text-primary-foreground')}
						>
							<social.icon class="h-5 w-5" />
						</a>
					{/each}
				</div>
			</div>

			<!-- Link columns -->
			{#if showNav}
				{#each footerLinkGroups as group (group.id)}
					<nav aria-label={group.heading} class="min-w-0">
						<h3 class="mb-4 text-sm font-semibold tracking-wider text-background uppercase">
							{group.heading}
						</h3>
						<ul class="space-y-3">
							{#each group.links as item (item.href)}
								<li>
									<Link
										href={item.href}
										class="text-sm text-background/60 transition-colors hover:text-primary"
									>
										{item.label}
									</Link>
								</li>
							{/each}
						</ul>
					</nav>
				{/each}
			{/if}
		</div>

		<!-- Bottom bar -->
		<div class="border-t border-background/10 py-6 lg:py-8">
			<div class="flex flex-col items-center justify-between gap-4 sm:flex-row">
				<p class="text-sm text-background/50">
					© {year}
					{COMPANY_DATA.NAME}. All rights reserved.
				</p>

				<div class="flex items-center gap-4">
					<span class="text-xs text-background/70">Payments secured by</span>
					<div class="flex gap-2">
						{#each paymentMethods as method (method)}
							<div class={cn(chipClass, 'h-8 w-12 rounded text-xs font-bold')}>
								{method}
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</div>
</footer>
