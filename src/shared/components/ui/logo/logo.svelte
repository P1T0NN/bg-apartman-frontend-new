<script lang="ts">
	// CONFIG
	import { COMPANY_DATA } from '@/shared/constants.js';
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/routeEndpoints.js';

	// COMPONENTS
	import Link from '@/shared/components/ui/link/link.svelte';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { HTMLAnchorAttributes } from 'svelte/elements';

	type Props = {
		class?: string;
		/** Logo image URL (defaults to the optimized static asset). */
		src?: string;
		/** Passed through to `<img>` (e.g. brightness on dark heroes). */
		imgClass?: string;
		href?: string;
		alt?: string;
		/** Visual size in the header / drawer. */
		size?: 'sm' | 'md';
	} & Omit<HTMLAnchorAttributes, 'href' | 'class' | 'children'>;

	let {
		class: className,
		src = COMPANY_DATA.LOGO,
		imgClass,
		href = UNPROTECTED_PAGE_ENDPOINTS.ROOT,
		alt = `${COMPANY_DATA.NAME} logo`,
		size = 'md',
		...restProps
	}: Props = $props();

	const sizeStyles = $derived(
		size === 'sm'
			? 'h-7 max-h-7 w-auto max-w-[min(9rem,40vw)]'
			: 'h-8 max-h-9 w-auto max-w-[min(10rem,45vw)]'
	);
</script>

<Link
	{href}
	class={cn(
		'inline-flex min-w-0 shrink-0 items-center rounded-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
		className
	)}
	{...restProps}
>
	<img
		{src}
		{alt}
		class={cn('object-contain object-left', sizeStyles, imgClass)}
		width="160"
		height="36"
		loading="eager"
		decoding="async"
		draggable="false"
	/>
</Link>
