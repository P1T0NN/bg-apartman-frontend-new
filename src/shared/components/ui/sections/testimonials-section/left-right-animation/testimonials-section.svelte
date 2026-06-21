<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';

	// COMPONENTS
	import Section from '@/shared/components/ui/section/section.svelte';
	import TestimonialsSectionTop from './testimonials-section-top.svelte';
	import TestimonialsSectionBottom from './testimonials-section-bottom.svelte';
</script>

<Section
	id="testimonials"
	surface="background"
	yPadding="lg"
	contain={false}
	ariaLabelledby="testimonials-heading"
>
	<div class="mb-12 flex w-full flex-col items-center justify-center gap-2 px-6">
		<div class="mb-2 flex items-center gap-3">
			<div class="bg-primary h-px w-8"></div>
			<span class="font-body text-primary text-xs tracking-[0.2em] uppercase">
				{m['TestimonialsSection.UpDownAnimation.socialProof']()}
			</span>
		</div>

		<h3
			id="testimonials-heading"
			class="font-display text-foreground text-center text-4xl leading-none tracking-wide sm:text-5xl md:text-6xl"
		>
			{m['TestimonialsSection.UpDownAnimation.seeWhyClientsKeepComingBack']()}
		</h3>
	</div>

	<div class="flex flex-col gap-3">
		<TestimonialsSectionTop />
		<TestimonialsSectionBottom />
	</div>
</Section>
