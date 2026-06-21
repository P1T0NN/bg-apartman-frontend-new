<script lang="ts">
	// COMPONENTS
	import TestimonialsSectionItem from './testimonials-section-item.svelte';

	// DATA
	import { TESTIMONIALS } from '../testimonialsData';

	const TOP_ROW = TESTIMONIALS.slice(0, 7);
</script>

<div
	style="mask-image:linear-gradient(to left, transparent 0%, black 20%, black 80%, transparent 95%)"
	class="relative flex shrink-0 justify-around gap-5 overflow-hidden"
>
	<div class="mx-auto max-w-full">
		<div class="mx-auto w-full px-4 md:px-10">
			<div class="marquee-reverse flex w-max shrink-0 flex-nowrap gap-5">
				{#each TOP_ROW as testimonial (testimonial.name)}
					<TestimonialsSectionItem
						quote={testimonial.quote}
						name={testimonial.name}
						role={testimonial.role}
						avatarSrc={testimonial.avatar}
						xUrl={testimonial.xUrl}
					/>
				{/each}

				<!-- Duplicate so the marquee can loop seamlessly. aria-hidden so screen readers don't repeat. -->
				{#each TOP_ROW as testimonial (testimonial.name + '-dup')}
					<div aria-hidden="true">
						<TestimonialsSectionItem
							quote={testimonial.quote}
							name={testimonial.name}
							role={testimonial.role}
							avatarSrc={testimonial.avatar}
							xUrl={testimonial.xUrl}
						/>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>

<style>
	.marquee-reverse {
		animation: scroll-reverse 100s linear infinite;
	}

	.marquee-reverse:hover {
		animation-play-state: paused;
	}

	@keyframes scroll-reverse {
		0% {
			transform: translateX(-50%);
		}
		100% {
			transform: translateX(0);
		}
	}
</style>
