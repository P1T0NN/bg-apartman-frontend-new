<script lang="ts">
	// COMPONENTS
	import Section from '@/shared/components/ui/section/section.svelte';

	// LUCIDE ICONS
	import BadgeCheckIcon from '@lucide/svelte/icons/badge-check';
	import ReceiptTextIcon from '@lucide/svelte/icons/receipt-text';
	import CalendarCheckIcon from '@lucide/svelte/icons/calendar-check';
	import HeadsetIcon from '@lucide/svelte/icons/headset';

	const reasons = [
		{
			icon: BadgeCheckIcon,
			title: 'Handpicked apartments',
			text: 'Every place is personally vetted — real photos, honest descriptions, no surprises at check-in.'
		},
		{
			icon: ReceiptTextIcon,
			title: 'Transparent pricing',
			text: 'The price you see is the price you pay. No hidden fees, no cleaning-fee games.'
		},
		{
			icon: CalendarCheckIcon,
			title: 'Book in minutes',
			text: 'Pick your dates, confirm, and get your booking details right away — no back-and-forth.'
		},
		{
			icon: HeadsetIcon,
			title: 'Local support',
			text: "We're based in Belgrade. If anything comes up during your stay, a real person answers."
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
			<p class="text-xs font-semibold tracking-[0.22em] text-primary uppercase">Why BGApartman</p>
			<h2
				class="mt-4 font-display text-3xl font-medium tracking-tight text-balance text-background sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]"
			>
				Booking a stay,<br class="hidden sm:block" /> without the guesswork
			</h2>

			<p class="mt-5 max-w-md text-pretty text-background/60">
				We're a small Belgrade team, not a faceless marketplace. That shapes everything below.
			</p>

			<p class="mt-8 max-w-md border-l-2 border-primary pl-4 text-sm text-pretty text-background/80">
				No apps to download, no drawn-out email threads — just a good place to stay and someone to
				call if you need them.
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
