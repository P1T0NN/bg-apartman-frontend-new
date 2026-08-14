<script lang="ts">
	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { Snippet } from 'svelte';

	let {
		eyebrow,
		title,
		text,
		numeral,
		image,
		media,
		reversed = false,
		dark = false,
		class: className
	}: {
		/** Small label above the title, e.g. "Dashboard". */
		eyebrow: string;
		title: string;
		text: string;
		/** Ghost serif numeral leading the eyebrow, e.g. "01". */
		numeral?: string;
		/** Window-framed screenshot — browser chrome (URL pill) + the capture. */
		image?: { src: string; alt: string; url: string };
		/** Arbitrary media instead of the window frame (a chart, calendar, video…). */
		media?: Snippet;
		/** Flip the columns: media right (default) or left. */
		reversed?: boolean;
		/** Sit on a dark surface (`bg-foreground` band): copy inverts to the background tone,
		 *  the frame's border softens to match — the frame itself stays `bg-card` so a light
		 *  capture still reads as one bright window. */
		dark?: boolean;
		class?: string;
	} = $props();
</script>

<article class={cn('grid items-center gap-8 lg:grid-cols-2 lg:gap-14', className)}>
	<div class={reversed ? 'lg:order-2' : 'lg:order-1'}>
		<p class="text-xs font-semibold tracking-[0.22em] text-primary uppercase">
			{#if numeral}
				<span class="font-serif text-sm text-primary/60 normal-case">{numeral}</span>
			{/if}
			{eyebrow}
		</p>
		<h3
			class={cn(
				'mt-3 font-serif text-2xl font-medium tracking-tight text-balance sm:text-3xl',
				dark ? 'text-background' : 'text-foreground'
			)}
		>
			{title}
		</h3>
		<p
			class={cn(
				'mt-3 max-w-md leading-relaxed text-pretty',
				dark ? 'text-background/60' : 'text-muted-foreground'
			)}
		>
			{text}
		</p>
	</div>

	<div class={reversed ? 'lg:order-1' : 'lg:order-2'}>
		{#if media}
			{@render media()}
		{:else if image}
			<div class="relative">
				<div aria-hidden="true" class="absolute -inset-5 rounded-4xl bg-primary/10 blur-2xl"></div>
				<figure
					class={cn(
						'group/frame relative overflow-hidden rounded-xl bg-card shadow-xl transition-transform duration-500 hover:-translate-y-1',
						dark ? 'border border-background/15' : 'border border-border'
					)}
				>
					<div class="flex items-center gap-1.5 border-b border-border/70 px-4 py-2.5">
						<span class="size-2.5 rounded-full bg-border"></span>
						<span class="size-2.5 rounded-full bg-border"></span>
						<span class="size-2.5 rounded-full bg-border"></span>
						<span
							class="ml-3 flex-1 truncate rounded-md bg-muted px-2 py-0.5 font-mono text-[0.65rem] text-muted-foreground"
						>
							{image.url}
						</span>
					</div>
					<img
						src={image.src}
						alt={image.alt}
						loading="lazy"
						class="aspect-16/10 w-full bg-muted object-contain transition-transform duration-500 group-hover/frame:scale-[1.02]"
					/>
				</figure>
			</div>
		{/if}
	</div>
</article>
