<script lang="ts">
	// COMPONENTS
	import * as Avatar from '@/shared/components/ui/avatar';

	// TYPES
	import type { typesTestimonial } from '../testimonialTypes';

	// LUCIDE ICONS
	import StarIcon from '@lucide/svelte/icons/star';

	let { testimonial, variant = 'default' }: {
		testimonial: typesTestimonial;
		variant?: 'featured' | 'default';
	} = $props();

	const fallbackInitial = $derived(
		testimonial.name.trim().charAt(0).toLocaleUpperCase(undefined) || '?'
	);
</script>

{#if variant === 'featured'}
	<div class="relative mx-auto max-w-2xl px-6 text-center sm:px-16">
		<span
			class="pointer-events-none absolute -top-10 left-0 select-none font-serif text-[10rem] leading-none text-primary/6 sm:left-4"
			aria-hidden="true"
		>"</span>

		<p class="relative font-serif text-2xl font-medium italic leading-relaxed text-primary sm:text-3xl">
			{testimonial.quote}
		</p>

		<div class="mt-8 flex flex-col items-center gap-3">
			<Avatar.Root class="ring-border size-14 ring-2 ring-offset-2 ring-offset-background sm:size-16">
				<Avatar.Image
					src={testimonial.avatar}
					width={128}
					height={128}
					alt=""
				/>
				<Avatar.Fallback aria-hidden="true">{fallbackInitial}</Avatar.Fallback>
			</Avatar.Root>

			<div class="flex flex-col items-center gap-2">
				<div class="flex gap-1 text-accent" aria-label="{testimonial.stars} out of 5 stars">
					{#each [...Array(testimonial.stars ?? 0).keys()] as index (index)}
						<StarIcon class="size-3.5 shrink-0 fill-current" aria-hidden="true" />
					{/each}
				</div>

				<p class="font-serif text-sm italic text-muted-foreground">— {testimonial.name}</p>
			</div>
		</div>
	</div>
{:else}
	<div class="border-l-2 border-secondary/30 pl-6">
		<p class="font-serif text-lg font-medium italic leading-relaxed text-foreground/80">
			"{testimonial.quote}"
		</p>

		<div class="mt-4 flex items-start gap-3">
			<Avatar.Root class="ring-border shrink-0 ring-2 ring-offset-2 ring-offset-background">
				<Avatar.Image
					src={testimonial.avatar}
					width={64}
					height={64}
					alt=""
				/>
				<Avatar.Fallback class="text-xs" aria-hidden="true">{fallbackInitial}</Avatar.Fallback>
			</Avatar.Root>

			<div class="min-w-0 flex-1 pt-0.5">
				<div class="flex gap-0.5 text-accent" aria-label="{testimonial.stars} out of 5 stars">
					{#each [...Array(testimonial.stars ?? 0).keys()] as index (index)}
						<StarIcon class="size-3 shrink-0 fill-current" aria-hidden="true" />
					{/each}
				</div>
				
				<p class="mt-1 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
					{testimonial.name}
				</p>
			</div>
		</div>
	</div>
{/if}
