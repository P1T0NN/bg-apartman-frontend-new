<script lang="ts">
	// COMPONENTS
	import QualityImage from '@/shared/components/ui/quality-image/quality-image.svelte';

	// TYPES
	import type { typesTestimonial } from '../testimonialTypes';

	let {
		testimonial,
		cardShadow = '6px 6px 0px 0px rgba(0,0,0,1)'
	}: { testimonial: typesTestimonial; cardShadow?: string } = $props();
</script>

<div class="pl-2 md:pl-4 flex-[0_0_85%] min-w-0 md:flex-none md:w-full md:basis-1/2 lg:basis-full">
	<div
		class="group flex h-full min-w-0 flex-col gap-3 border-2 border-black bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_var(--primary)] md:gap-8 md:p-8"
		style={cardShadow ? `box-shadow: ${cardShadow}` : undefined}
	>
		<div class="text-3xl leading-none text-primary md:text-6xl">"</div>

		<p class="flex-1 text-sm leading-snug text-neutral-700 italic md:text-lg md:leading-relaxed">
			{testimonial.quote}
		</p>

		<div class="flex items-center gap-3 border-t border-neutral-200 pt-4 md:gap-4 md:pt-6">
			<div
				class="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border-2 border-black md:h-10 md:w-10"
			>
				<QualityImage
					src={testimonial.avatar}
					alt={testimonial.name}
					width={40}
					height={40}
					class="h-full w-full object-cover"
				/>
			</div>

			<div>
				<p class="font-black tracking-tight uppercase">{testimonial.name}</p>
			</div>
		</div>
	</div>
</div>
