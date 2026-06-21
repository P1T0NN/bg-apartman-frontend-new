<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';

	// COMPONENTS
	import Section from '@/shared/components/ui/section/section.svelte';
	import TestimonialsSectionItem from './testimonials-section-item.svelte';

	// DATA
	import { TESTIMONIALS } from '../testimonialsData';

	/**
	 * Each entry pairs a testimonial with how it should appear on the wall.
	 *  - `variant` picks the card visual (polaroid / quote chip / handwritten note).
	 *  - `desktop` is a tailwind class string applied only at lg+ that hand-places the card
	 *    via absolute positioning, sets its width, and gives it a slight rotation. Mobile
	 *    ignores this entirely and stacks cleanly via the flex column below.
	 *
	 * The coordinates are picked so the wall reads as scattered-but-curated: no two cards
	 * share a baseline, three diagonals run through the layout, and overlaps occur only at
	 * card *edges* (not over text).
	 */
	const PLACEMENTS: Array<{
		variant: 'polaroid' | 'chip' | 'note';
		desktop: string;
	}> = [
		{ variant: 'polaroid', desktop: 'lg:absolute lg:top-0 lg:left-[2%] lg:w-[18rem] lg:-rotate-3' },
		{ variant: 'chip',     desktop: 'lg:absolute lg:top-[2rem] lg:left-[30%] lg:w-[19rem] lg:rotate-2' },
		{ variant: 'note',     desktop: 'lg:absolute lg:top-0 lg:right-[3%] lg:w-[17rem] lg:rotate-1' },
		{ variant: 'note',     desktop: 'lg:absolute lg:top-[14rem] lg:left-[10%] lg:w-[16rem] lg:rotate-2' },
		{ variant: 'polaroid', desktop: 'lg:absolute lg:top-[15rem] lg:left-[37%] lg:w-[19rem] lg:-rotate-2' },
		{ variant: 'chip',     desktop: 'lg:absolute lg:top-[13rem] lg:right-[5%] lg:w-[18rem] lg:-rotate-1' },
		{ variant: 'polaroid', desktop: 'lg:absolute lg:top-[28rem] lg:left-[24%] lg:w-[17rem] lg:rotate-3' },
		{ variant: 'note',     desktop: 'lg:absolute lg:top-[29rem] lg:right-[14%] lg:w-[16rem] lg:-rotate-3' }
	];

	const ITEMS = TESTIMONIALS.slice(0, PLACEMENTS.length).map((testimonial, i) => ({
		testimonial,
		...PLACEMENTS[i]
	}));
</script>

<Section
	id="testimonials"
	surface="muted"
	contain={true}
	ariaLabelledby="testimonials-heading"
>
	<div class="relative">
		<header class="relative mx-auto mb-12 max-w-2xl text-center md:mb-16 lg:mb-20">
			<p class="text-muted-foreground mb-4 text-[0.7rem] font-semibold tracking-[0.3em] uppercase">
				<span aria-hidden="true" class="bg-muted-foreground/40 mr-3 inline-block h-px w-8 align-middle"></span>
				{m['TestimonialsSection.PremiumDesign.eyebrow']()}
				<span aria-hidden="true" class="bg-muted-foreground/40 ml-3 inline-block h-px w-8 align-middle"></span>
			</p>
			<h2
				id="testimonials-heading"
				class="text-primary font-serif text-3xl leading-[1.05] font-medium italic sm:text-4xl lg:text-5xl"
			>
				{m['TestimonialsSection.PremiumDesign.title']()}
			</h2>
		</header>

		<!--
			Mobile: simple flex column, no absolute positioning, no rotation, no overlap.
			lg+: container becomes a fixed-height canvas; cards switch to absolute via the
			`desktop` class string and scatter across it.
		-->
		<div class="relative flex flex-col gap-6 lg:block lg:h-200">
			{#each ITEMS as { testimonial, variant, desktop } (testimonial.name)}
				<div class={desktop}>
					<TestimonialsSectionItem {testimonial} {variant} />
				</div>
			{/each}
		</div>
	</div>
</Section>
