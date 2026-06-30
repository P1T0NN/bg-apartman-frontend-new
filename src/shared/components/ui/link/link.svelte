<script lang="ts">
	// LIBRARIES
	import { localizeHref } from '@/shared/lib/paraglide/runtime';

	// UTILS
	import { shouldSkipLocalePrefix } from '@/utils/paraglideHref';
	import { cn, type WithElementRef } from '@/utils/utils.js';

	// TYPES
	import type { HTMLAnchorAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';

	export type LinkProps = WithElementRef<
		Omit<HTMLAnchorAttributes, 'href'> & {
			href: string;
			/** Override target locale; defaults to current locale from the URL. */
			locale?: 'en' | 'sr';
			children: Snippet;
		}
	>;

	let {
		class: className,
		href,
		locale,
		ref = $bindable(null),
		children,
		...restProps
	}: LinkProps = $props();

	const localizedHref = $derived(
		shouldSkipLocalePrefix(href)
			? href
			: localizeHref(href, locale !== undefined ? { locale } : undefined)
	);
</script>

<a bind:this={ref} data-slot="link" href={localizedHref} class={cn(className)} {...restProps}>
	{@render children()}
</a>
