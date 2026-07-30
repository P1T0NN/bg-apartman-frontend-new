<script lang="ts">
	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { Component, Snippet } from 'svelte';

	// LUCIDE ICONS (defaults — override via the `arrowLeft` / `arrowRight` props)
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';

	type Props = {
		/** One snippet per slide. */
		slides: Snippet[];
		/** Prev/next arrows (each slide links to its neighbour — pure anchor nav). */
		arrows?: boolean;
		/** Dot links below the track. */
		dots?: boolean;
		class?: string;
		/** Extra classes on each slide (e.g. `basis-4/5` for a peeking multi-item carousel). */
		slideClass?: string;
		/** Accessible name for the carousel region. */
		label?: string;
		/** Override the previous-arrow icon (defaults to a lucide chevron). */
		arrowLeft?: Component<{ class?: string }>;
		/** Override the next-arrow icon (defaults to a lucide chevron). */
		arrowRight?: Component<{ class?: string }>;
	};

	let {
		slides,
		arrows = true,
		dots = true,
		class: className,
		slideClass,
		label = 'Carousel',
		arrowLeft: ArrowLeft = ChevronLeftIcon,
		arrowRight: ArrowRight = ChevronRightIcon
	}: Props = $props();

	const uid = $props.id();
	const slideId = (i: number) => `${uid}-${i}`;
</script>

<div
	class={cn('carousel relative', className)}
	role="region"
	aria-roledescription="carousel"
	aria-label={label}
	data-arrows={arrows}
	data-dots={dots}
>
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<!-- Focusable so keyboard users can arrow-scroll the snap track (WCAG 2.1.1). -->
	<div
		class="carousel__track flex snap-x snap-mandatory overflow-x-auto scroll-smooth"
		tabindex="0"
	>
		{#each slides as slide, i (i)}
			<div
				id={slideId(i)}
				class={cn('carousel__slide relative w-full shrink-0 snap-start snap-always', slideClass)}
				role="group"
				aria-roledescription="slide"
				aria-label={`${i + 1} of ${slides.length}`}
			>
				{@render slide()}

				{#if arrows && i > 0}
					<a href={`#${slideId(i - 1)}`} class="carousel__arrow left-3" aria-label="Previous slide">
						<ArrowLeft class="size-5" />
					</a>
				{/if}

				{#if arrows && i < slides.length - 1}
					<a href={`#${slideId(i + 1)}`} class="carousel__arrow right-3" aria-label="Next slide">
						<ArrowRight class="size-5" />
					</a>
				{/if}
			</div>
		{/each}
	</div>

	{#if dots && slides.length > 1}
		<div class="carousel__dots mt-3 flex justify-center gap-2">
			{#each [...slides.keys()] as i (i)}
				<a
					href={`#${slideId(i)}`}
					class="size-2.5 rounded-full bg-muted-foreground/30 transition-colors hover:bg-muted-foreground focus-visible:bg-muted-foreground focus-visible:outline-none"
					aria-label={`Go to slide ${i + 1}`}
				></a>
			{/each}
		</div>
	{/if}
</div>

<style>
	/* Hide the scrollbar; navigation is via swipe, arrows, and dots. */
	.carousel__track {
		scrollbar-width: none;
	}
	.carousel__track::-webkit-scrollbar {
		display: none;
	}

	.carousel__arrow {
		position: absolute;
		top: 50%;
		translate: 0 -50%;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: 9999px;
		background: color-mix(in oklab, var(--background) 80%, transparent);
		color: var(--foreground);
		box-shadow: 0 1px 3px rgb(0 0 0 / 0.2);
		backdrop-filter: blur(4px);
	}
	.carousel__arrow:hover {
		background: var(--background);
	}

	/* Respect users who don't want the smooth scroll animation. */
	@media (prefers-reduced-motion: reduce) {
		.carousel__track {
			scroll-behavior: auto;
		}
	}

	/*
	 * Progressive enhancement: where the browser supports the native CSS Carousel
	 * pseudo-elements (Chrome/Edge, Safari 18.2+), drop the anchor-link fallback and
	 * let the browser generate the markers + buttons — this also gives active-dot
	 * tracking while swiping, which the fallback can't do. Firefox etc. keep the
	 * fallback above until they ship it. The @supports query IS the feature check.
	 */
	@supports (scroll-marker-group: after) {
		/* Retire the JS-free fallback controls; the browser provides its own. */
		.carousel__arrow,
		.carousel__dots {
			display: none;
		}

		/* Dots (markers) — only when `dots` is enabled. */
		.carousel[data-dots='true'] .carousel__track {
			scroll-marker-group: after;
		}

		.carousel__track::scroll-marker-group {
			display: flex;
			justify-content: center;
			gap: 0.5rem;
			margin-top: 0.75rem;
		}

		.carousel__slide::scroll-marker {
			content: '';
			width: 0.625rem;
			height: 0.625rem;
			border-radius: 9999px;
			background: color-mix(in oklab, var(--muted-foreground) 30%, transparent);
			cursor: pointer;
			transition: background-color 0.15s ease;
		}

		.carousel__slide::scroll-marker:hover,
		.carousel__slide::scroll-marker:focus-visible {
			background: var(--muted-foreground);
			outline: none;
		}

		/* The active slide's marker. */
		.carousel__slide::scroll-marker:target-current {
			background: var(--foreground);
		}

		/* Arrows (buttons) — only when `arrows` is enabled. They auto-disable at the ends. */
		.carousel[data-arrows='true'] .carousel__track::scroll-button(left),
		.carousel[data-arrows='true'] .carousel__track::scroll-button(right) {
			position: absolute;
			top: 50%;
			translate: 0 -50%;
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 2rem;
			height: 2rem;
			border: 0;
			border-radius: 9999px;
			background: color-mix(in oklab, var(--background) 80%, transparent);
			color: var(--foreground);
			box-shadow: 0 1px 3px rgb(0 0 0 / 0.2);
			backdrop-filter: blur(4px);
			cursor: pointer;
			z-index: 1;
		}

		.carousel[data-arrows='true'] .carousel__track::scroll-button(left) {
			content: '‹';
			left: 0.75rem;
		}

		.carousel[data-arrows='true'] .carousel__track::scroll-button(right) {
			content: '›';
			right: 0.75rem;
		}

		.carousel__track::scroll-button(*):disabled {
			opacity: 0;
			pointer-events: none;
		}
	}
</style>
