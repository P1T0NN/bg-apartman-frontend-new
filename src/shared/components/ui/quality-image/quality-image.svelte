<script lang="ts">
	import { cn } from '@/shared/utils/utils.js';
	import type { HTMLImgAttributes } from 'svelte/elements';

	interface Props extends Omit<HTMLImgAttributes, 'src' | 'alt'> {
		src: string;
		alt: string;
		srcset?: string;
		sizes?: string;
		width?: number;
		height?: number;
		loading?: 'lazy' | 'eager';
		fetchpriority?: 'high' | 'low' | 'auto';
		decoding?: 'async' | 'sync' | 'auto';
		class?: string;
	}

	let {
		src,
		alt,
		srcset,
		sizes,
		width,
		height,
		loading = 'lazy',
		fetchpriority,
		decoding = 'async',
		class: className = '',
		...rest
	}: Props = $props();
</script>

<img
	{src}
	{alt}
	srcset={srcset}
	sizes={sizes}
	width={width}
	height={height}
	{loading}
	fetchpriority={fetchpriority}
	{decoding}
	class={cn(className)}
	{...rest}
/>
