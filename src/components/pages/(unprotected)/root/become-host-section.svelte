<script lang="ts">
	// COMPONENTS
	import Section from '@/components/ui/section/section.svelte';

	// LUCIDE ICONS
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
	import CalendarCheckIcon from '@lucide/svelte/icons/calendar-check';
	import Building2Icon from '@lucide/svelte/icons/building-2';

	// The host's four tools, one cell each. Copy is the whole sell here — no screenshots —
	// so every cell leads with a serif claim and closes with a mono micro-label that names
	// the promise in one word.
	const tools = [
		{
			icon: LayoutDashboardIcon,
			numeral: '01',
			title: 'Your numbers, live.',
			text: 'Pending requests, arrivals and departures, occupancy against last month, and the earnings held for you.',
		},
		{
			icon: TrendingUpIcon,
			numeral: '02',
			title: 'Trends, up to a year.',
			text: 'Revenue and bookings for any period up to 366 days, plus a per-listing breakdown of which place is carrying you.',
		},
		{
			icon: CalendarCheckIcon,
			numeral: '03',
			title: 'Every request, one decision.',
			text: 'Approve, decline or ask the guest to confirm their stay — deadlines and cancellation windows handled for you.',
		},
		{
			icon: Building2Icon,
			numeral: '04',
			title: 'Every listing in one table.',
			text: 'Publishing status, pricing and fees at a glance — edit, renew or add another place in a click.',
		}
	];
</script>

<!-- No `yPadding="lg"` here: a bare `pt-0` can't beat `sm:py-20` (the media-query block
     lands after the base rule in the stylesheet) and tailwind-merge drops the whole
     `py-16` on conflict, killing the mobile bottom padding. So the padding is explicit:
     top dropped — Featured → this band is the only light-to-light pair, both paddings
     stacked to a double gap — bottom kept at lg's rhythm (py-16 sm:py-20 lg:py-24). -->
<Section id="become-host" class="scroll-mt-14 pt-0 pb-16 sm:pb-20 lg:pb-24" yPadding="none">
	<div
		class="rounded-4xl border border-primary/15 px-6 py-12 sm:px-10 lg:px-16 lg:py-16"
		style="background: color-mix(in oklch, var(--primary) 5%, var(--card));"
	>
		<!-- Intro: the claim left, a decorative data motif right — the dashboard as a whisper,
		     not a screenshot. -->
		<div class="grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
			<div class="max-w-2xl lg:col-span-5">
				<p class="text-xs font-semibold tracking-[0.22em] text-primary uppercase">For hosts</p>
				<h2
					class="mt-3 font-serif text-3xl font-medium tracking-tight text-balance sm:text-4xl"
				>
					Everything that runs your hosting.
				</h2>
				<p class="mt-4 text-pretty text-muted-foreground">
					Four screens do the whole job — here's what you get once your place is live.
				</p>
			</div>

			<div class="lg:col-span-7">
				<div
					class="overflow-hidden rounded-2xl border border-border bg-card"
					aria-hidden="true"
				>
					<div class="flex items-center justify-between border-b border-border px-4 py-2.5">
						<span class="font-mono text-[0.65rem] tracking-[0.18em] text-muted-foreground uppercase">Revenue · last 12 months</span>
					</div>
					<svg viewBox="0 0 560 240" preserveAspectRatio="none" class="h-auto w-full">
						<defs>
							<linearGradient id="become-host-area" x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stop-color="var(--primary)" stop-opacity="0.35" />
								<stop offset="100%" stop-color="var(--primary)" stop-opacity="0" />
							</linearGradient>
						</defs>

						<!-- hairline grid -->
						<g class="text-foreground/10">
							<line x1="0" y1="40" x2="560" y2="40" stroke="currentColor" stroke-width="1" />
							<line x1="0" y1="90" x2="560" y2="90" stroke="currentColor" stroke-width="1" />
							<line x1="0" y1="140" x2="560" y2="140" stroke="currentColor" stroke-width="1" />
							<line x1="0" y1="190" x2="560" y2="190" stroke="currentColor" stroke-width="1" />
						</g>

						<!-- last period, dashed — the quiet rival -->
						<path
							d="M0 180 C70 176 90 158 130 155 C180 150 210 165 260 160 C310 155 340 135 390 132 C440 129 490 140 560 136"
							fill="none"
							stroke="currentColor"
							class="text-foreground/25"
							stroke-width="1.5"
							stroke-dasharray="2 7"
						/>

						<!-- this period — the area and its edge -->
						<path
							d="M0 200 C70 192 90 160 130 152 C180 142 200 168 250 158 C300 148 320 128 370 122 C420 116 470 96 560 88 L560 240 L0 240 Z"
							fill="url(#become-host-area)"
						/>
						<path
							d="M0 200 C70 192 90 160 130 152 C180 142 200 168 250 158 C300 148 320 128 370 122 C420 116 470 96 560 88"
							fill="none"
							stroke="var(--primary)"
							stroke-width="2.5"
						/>

						<!-- today -->
						<circle cx="560" cy="88" r="10" fill="none" stroke="var(--primary)" stroke-opacity="0.35" />
						<circle cx="560" cy="88" r="4" fill="var(--primary)" />
					</svg>
				</div>
			</div>
		</div>

		<!-- The four tools — hairline-divided, one cell per instrument -->
		<div
			class="mt-12 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:mt-16"
		>
			{#each tools as tool (tool.title)}
				<div
					class="group flex flex-col gap-3 bg-card p-6 transition-colors duration-300 hover:bg-muted/40 sm:p-8"
				>
					<div class="flex items-start justify-between gap-4">
						<span
							class="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform duration-300 group-hover:-translate-y-0.5"
						>
							<svelte:component this={tool.icon} class="size-5" aria-hidden="true" />
						</span>
						<span
							class="font-serif text-3xl leading-none font-medium text-primary/20 tabular-nums transition-colors duration-300 group-hover:text-primary"
						>
							{tool.numeral}
						</span>
					</div>

					<h3
						class="mt-1 font-serif text-xl font-medium tracking-tight text-balance sm:text-2xl"
					>
						{tool.title}
					</h3>
					<p class="text-sm leading-relaxed text-pretty text-muted-foreground">{tool.text}</p>
				</div>
			{/each}
		</div>
	</div>
</Section>
