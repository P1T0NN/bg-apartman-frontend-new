<script lang="ts">
	// CONFIG
	import { COMPANY_DATA } from '@/shared/constants.js';
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/routeEndpoints.js';

	// CLASSES
	import { footerLinkClass, footerLinkGroups } from './footer.svelte.ts';

	// COMPONENTS
	import Link from '@/shared/components/ui/link/link.svelte';
	import Logo from '@/shared/components/ui/logo/logo.svelte';

	// UTILS
	import { cn } from '@/utils/utils.js';

	type Props = {
		class?: string;
		/** Show [`Logo`](@/shared/components/ui/logo/logo.svelte); if false, use the company name link. */
		hasLogo?: boolean;
		/** Render [`footerLinkGroups`](./footer.svelte.ts). */
		showNav?: boolean;
	};

	let { class: className, hasLogo = true, showNav = true }: Props = $props();

	const year = new Date().getFullYear();
</script>

<footer
	class={cn(
		'w-full max-w-full overflow-x-clip border-t border-border bg-muted text-foreground',
		className
	)}
>
	<div class="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
		<div
			class="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-10 lg:gap-y-0"
		>
			<div class="min-w-0 lg:col-span-4">
				{#if hasLogo}
					<Logo size="md" />
				{:else}
					<Link
						href={UNPROTECTED_PAGE_ENDPOINTS.ROOT}
						class="text-foreground text-base font-semibold tracking-tight"
					>
						{COMPANY_DATA.NAME}
					</Link>
				{/if}

				<p class="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
					{COMPANY_DATA.DESCRIPTION}
				</p>
			</div>

			{#if showNav}
				<div
					class="grid min-w-0 grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:col-span-8 lg:justify-self-end"
				>
					{#each footerLinkGroups as group (group.id)}
						<nav aria-label={group.heading} class="min-w-0">
							<p
								class="text-foreground text-[0.6875rem] font-semibold uppercase tracking-[0.14em]"
							>
								{group.heading}
							</p>

							<ul class="mt-4 flex flex-col gap-3">
								{#each group.links as item (item.href)}
									<li>
										<Link href={item.href} class={footerLinkClass}>
											{item.label}
										</Link>
									</li>
								{/each}
							</ul>
						</nav>
					{/each}
				</div>
			{/if}
		</div>

		<div
			class="mt-14 border-t border-border pt-8 text-xs text-muted-foreground"
		>
			<p>
				© {year}
				{COMPANY_DATA.NAME}. All rights reserved.
			</p>
		</div>
	</div>
</footer>
