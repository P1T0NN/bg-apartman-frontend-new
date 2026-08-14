<script lang="ts">
	// I18N
	import { m } from '@/paraglide/messages';

	// COMPONENTS
	import Section from '@/components/ui/section/section.svelte';

	// LUCIDE ICONS
	import BadgeCheckIcon from '@lucide/svelte/icons/badge-check';
	import ReceiptTextIcon from '@lucide/svelte/icons/receipt-text';
	import CalendarCheckIcon from '@lucide/svelte/icons/calendar-check';
	import HeadsetIcon from '@lucide/svelte/icons/headset';

	const reasons = [
		{
			icon: BadgeCheckIcon,
			title: m['HomePage.WhyUsSection.reasonHandpickedTitle'](),
			text: m['HomePage.WhyUsSection.reasonHandpickedText']()
		},
		{
			icon: ReceiptTextIcon,
			title: m['HomePage.WhyUsSection.reasonTransparentTitle'](),
			text: m['HomePage.WhyUsSection.reasonTransparentText']()
		},
		{
			icon: CalendarCheckIcon,
			title: m['HomePage.WhyUsSection.reasonBookTitle'](),
			text: m['HomePage.WhyUsSection.reasonBookText']()
		},
		{
			icon: HeadsetIcon,
			title: m['HomePage.WhyUsSection.reasonLocalTitle'](),
			text: m['HomePage.WhyUsSection.reasonLocalText']()
		}
	];
</script>

<Section
	id="why-us"
	class="scroll-mt-14 bg-foreground text-background"
	yPadding="xl"
	containerClass="grid gap-12 lg:grid-cols-12 lg:gap-16"
>
	<!-- Intro — sticks while the list scrolls on desktop -->
	<div class="lg:col-span-5">
		<div class="lg:sticky lg:top-28">
			<p class="text-xs font-semibold tracking-[0.22em] text-primary uppercase">
				{m['HomePage.WhyUsSection.eyebrow']()}
			</p>
			<h2
				class="mt-4 font-display text-3xl font-medium tracking-tight text-balance text-background sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]"
			>
				{m['HomePage.WhyUsSection.bookingAStay']()}<br class="hidden sm:block" />{' '}
				{m['HomePage.WhyUsSection.withoutTheGuesswork']()}
			</h2>

			<p class="mt-5 max-w-md text-pretty text-background/60">
				{m['HomePage.WhyUsSection.intro']()}
			</p>

			<p
				class="mt-8 max-w-md border-l-2 border-primary pl-4 text-sm text-pretty text-background/80"
			>
				{m['HomePage.WhyUsSection.note']()}
			</p>
		</div>
	</div>

	<!-- Numbered list -->
	<ol class="lg:col-span-7">
		{#each reasons as reason, i (reason.title)}
			<li
				class="group grid grid-cols-[auto_1fr] items-start gap-x-5 border-t border-background/15 py-7 first:border-t-0 first:pt-0 sm:gap-x-8 sm:py-8"
			>
				<span
					class="font-display text-4xl font-medium text-primary/30 tabular-nums transition-colors duration-300 group-hover:text-primary sm:text-5xl"
				>
					{(i + 1).toString().padStart(2, '0')}
				</span>

				<div class="min-w-0">
					<div class="flex items-center gap-2.5">
						<reason.icon class="size-4 shrink-0 text-primary" />
						<h3 class="text-lg font-medium text-background">{reason.title}</h3>
					</div>
					<p class="mt-2 text-sm leading-relaxed text-pretty text-background/60">
						{reason.text}
					</p>
				</div>
			</li>
		{/each}
	</ol>
</Section>
