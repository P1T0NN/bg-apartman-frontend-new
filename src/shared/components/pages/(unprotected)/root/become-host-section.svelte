<script lang="ts">
	// LIBRARIES
	import { localizeHref } from '@/shared/lib/paraglide/runtime';

	// CONFIG
	import { PROTECTED_PAGE_ENDPOINTS } from '@/shared/routeEndpoints';

	// COMPONENTS
	import Section from '@/shared/components/ui/section/section.svelte';
	import { Button } from '@/shared/components/ui/button/index.js';

	// LUCIDE ICONS
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';

	const steps = [
		{
			title: 'Tell us about your place',
			text: 'A few photos and the basics. We help you polish the listing so it shows well.'
		},
		{
			title: 'Set your own terms',
			text: 'Your dates, your price, your house rules. Block off the weeks you keep for yourself.'
		},
		{
			title: 'Welcome your guests',
			text: 'We handle the bookings and guest questions — you just approve who stays.'
		}
	];
</script>

<Section id="become-host" class="scroll-mt-14" yPadding="lg">
	<div
		class="relative overflow-hidden rounded-[2rem] border border-primary/15 px-6 py-14 sm:px-10 sm:py-16 lg:px-16 lg:py-20"
		style="background: color-mix(in oklch, var(--primary) 5%, var(--card));"
	>
		<!-- Poster head -->
		<div class="max-w-3xl">
			<span
				class="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3 py-1 text-[0.7rem] font-semibold tracking-[0.18em] text-primary uppercase"
			>
				<span class="size-1.5 rounded-full bg-primary"></span>
				For owners in Belgrade
			</span>

			<h2
				class="mt-6 font-serif text-4xl leading-[1.05] font-medium tracking-tight text-balance text-foreground sm:text-5xl lg:text-6xl"
			>
				Your place in Belgrade,<br class="hidden sm:block" />
				<span class="text-primary italic">earning its keep.</span>
			</h2>

			<p class="mt-6 max-w-xl text-lg leading-relaxed text-pretty text-muted-foreground">
				A second apartment, or a flat you're not using every month — hosting doesn't have to become a
				second job. You decide when it's free and what it costs; we handle the listing, the bookings
				and the back-and-forth with guests.
			</p>

			<div class="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
				<Button
					href={localizeHref(PROTECTED_PAGE_ENDPOINTS.HOST_DASHBOARD)}
					size="lg"
					class="group gap-2"
				>
					Start hosting
					<ArrowRightIcon class="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
				</Button>
				<p class="text-sm text-muted-foreground">Free to list · No lock-in · Cancel anytime</p>
			</div>
		</div>

		<!-- How it works — a numbered rail with ghost serif numerals -->
		<ol
			class="mt-14 grid gap-8 border-t border-border/70 pt-10 sm:grid-cols-3 sm:gap-0 lg:mt-16"
		>
			{#each steps as step, i (step.title)}
				<li
					class="group sm:px-8 sm:first:pl-0 lg:px-10
						{i > 0 ? 'sm:border-l sm:border-border/60' : ''}"
				>
					<span
						class="font-serif text-5xl leading-none font-medium text-primary/20 tabular-nums transition-colors duration-300 group-hover:text-primary lg:text-6xl"
					>
						{(i + 1).toString().padStart(2, '0')}
					</span>
					<h3 class="mt-4 text-base font-semibold text-foreground">{step.title}</h3>
					<p class="mt-1.5 text-sm leading-relaxed text-pretty text-muted-foreground">
						{step.text}
					</p>
				</li>
			{/each}
		</ol>
	</div>
</Section>
