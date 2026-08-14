<script lang="ts">
	// LIBRARIES
	import { m } from '@/paraglide/messages';

	// COMPONENTS
	import Section from '@/components/ui/section/section.svelte';

	// LUCIDE ICONS
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
	import CalendarCheckIcon from '@lucide/svelte/icons/calendar-check';
	import Building2Icon from '@lucide/svelte/icons/building-2';
	import ReceiptIcon from '@lucide/svelte/icons/receipt';
	import PercentIcon from '@lucide/svelte/icons/percent';

	// The host's four tools. Each sits on its own bordered "plate" with the module number
	// stamped underneath the icon — read as fuse-box labels on a control panel, not as
	// step 1/2/3/4 of a process. There's no order dependency here, so the numeral is doing
	// an inventory job, not a sequence job.
	const tools = [
		{
			icon: LayoutDashboardIcon,
			numeral: '01',
			title: m['HomePage.BecomeHostSection.numbersTitle'](),
			text: m['HomePage.BecomeHostSection.numbersText']()
		},
		{
			icon: TrendingUpIcon,
			numeral: '02',
			title: m['HomePage.BecomeHostSection.trendsTitle'](),
			text: m['HomePage.BecomeHostSection.trendsText']()
		},
		{
			icon: CalendarCheckIcon,
			numeral: '03',
			title: m['HomePage.BecomeHostSection.requestsTitle'](),
			text: m['HomePage.BecomeHostSection.requestsText']()
		},
		{
			icon: Building2Icon,
			numeral: '04',
			title: m['HomePage.BecomeHostSection.listingsTitle'](),
			text: m['HomePage.BecomeHostSection.listingsText']()
		}
	];

	// The two payout models a host picks between at listing creation: a flat fee billed
	// every 3 months, or a cut taken per booking. This is a real either/or, so it's built
	// as a switch — a track with a sliding thumb and two selectable plates — rather than
	// two cards glued together with a floating "OR". Tapping a side is a live comparison
	// only; nothing here is submitted or saved.
	const pricingModels = [
		{
			id: 'flat' as const,
			icon: ReceiptIcon,
			meta: m['HomePage.BecomeHostSection.flatFeeMeta'](),
			title: m['HomePage.BecomeHostSection.flatFeeTitle'](),
			text: m['HomePage.BecomeHostSection.flatFeeText']()
		},
		{
			id: 'percentage' as const,
			icon: PercentIcon,
			meta: m['HomePage.BecomeHostSection.percentageMeta'](),
			title: m['HomePage.BecomeHostSection.percentageTitle'](),
			text: m['HomePage.BecomeHostSection.percentageText']()
		}
	];

	let selected = $state<'flat' | 'percentage'>('flat');
	const selectedIndex = $derived(pricingModels.findIndex((model) => model.id === selected));
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
		<!-- Intro: the claim left, a statement mock right. The mock isn't a screenshot of the
		     dashboard — it's a receipt: the shape a host actually cares about, and the same
		     motif the payout switch below settles into. -->
		<div class="grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
			<div class="max-w-2xl lg:col-span-5">
				<p class="text-xs font-semibold tracking-[0.22em] text-primary uppercase">
					{m['HomePage.BecomeHostSection.eyebrow']()}
				</p>
				<h2 class="mt-3 font-serif text-3xl font-medium tracking-tight text-balance sm:text-4xl">
					{m['HomePage.BecomeHostSection.title']()}
				</h2>
				<p class="mt-4 text-pretty text-muted-foreground">
					{m['HomePage.BecomeHostSection.subtitle']()}
				</p>
			</div>

			<div class="lg:col-span-7">
				<!-- This panel is pinned dark in both themes (bg-dark-elevated), same trick your
				     hero already uses — it's the one place on the page that doesn't flip with
				     light/dark, so the chart always reads as an instrument, not just another card. -->
				<div
					class="overflow-hidden rounded-2xl border border-dark-elevated-foreground/10 bg-dark-elevated text-dark-elevated-foreground"
					aria-hidden="true"
				>
					<div class="flex items-center justify-between border-b border-dark-elevated-foreground/10 px-4 py-2.5">
						<span
							class="font-mono text-[0.65rem] tracking-[0.18em] text-dark-elevated-foreground/60 uppercase"
							>{m['HomePage.BecomeHostSection.revenueLabel']()}</span
						>
					</div>
					<svg viewBox="0 0 560 240" preserveAspectRatio="none" class="h-auto w-full">
						<defs>
							<linearGradient id="become-host-area" x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stop-color="var(--primary)" stop-opacity="0.45" />
								<stop offset="100%" stop-color="var(--primary)" stop-opacity="0" />
							</linearGradient>
						</defs>

						<!-- hairline grid -->
						<g class="text-dark-elevated-foreground/10">
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
							class="text-dark-elevated-foreground/30"
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
						<circle
							cx="560"
							cy="88"
							r="10"
							fill="none"
							stroke="var(--primary)"
							stroke-opacity="0.4"
						/>
						<circle cx="560" cy="88" r="4" fill="var(--primary)" />
					</svg>
				</div>
			</div>
		</div>

		<!-- The four tools, each a plate: bordered icon square, module number stamped below
		     it, then the claim. Hairline-divided so the plates read as one panel. -->
		<div
			class="mt-12 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:mt-16"
		>
			{#each tools as tool (tool.title)}
				{@const Icon = tool.icon}
				<div
					class="group flex flex-col gap-4 bg-card p-6 transition-colors duration-300 hover:bg-muted/40 sm:flex-row sm:p-8"
				>
					<div class="flex shrink-0 flex-col items-center gap-1.5">
						<span
							class="flex size-12 items-center justify-center rounded-xl border border-border bg-primary/10 text-primary transition-transform duration-300 motion-reduce:transition-none group-hover:-translate-y-0.5"
						>
							<Icon class="size-5" aria-hidden="true" />
						</span>
						<span
							class="font-mono text-[0.65rem] tracking-[0.14em] text-muted-foreground/70 tabular-nums"
						>
							{tool.numeral}
						</span>
					</div>

					<div>
						<h3 class="font-serif text-xl font-medium tracking-tight text-balance sm:text-2xl">
							{tool.title}
						</h3>
						<p class="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">
							{tool.text}
						</p>
					</div>
				</div>
			{/each}
		</div>

		<!-- Payout terms — the one decision every host makes when they create a listing. A
		     switch, not a card grid: a track up top names the two billing cadences, its thumb
		     slides to whichever plate is active, and the plates themselves are buttons so a
		     visitor can flip between "billed quarterly" and "taken per booking" and feel the
		     difference before they ever see the real listing form. -->
		<div class="mt-12 lg:mt-16">
			<p class="text-xs font-semibold tracking-[0.22em] text-primary uppercase">
				{m['HomePage.BecomeHostSection.pricingEyebrow']()}
			</p>
			<h3 class="mt-3 font-serif text-2xl font-medium tracking-tight text-balance sm:text-3xl">
				{m['HomePage.BecomeHostSection.pricingTitle']()}
			</h3>
			<p class="mt-3 max-w-2xl text-pretty text-muted-foreground">
				{m['HomePage.BecomeHostSection.pricingSubtitle']()}
			</p>

			<div class="mt-8">
				<!-- Track: two mono labels sharing a rounded rail, thumb pinned to the active half -->
				<div
					class="relative mx-auto grid w-full max-w-sm grid-cols-2 rounded-full border border-border bg-muted/60 p-1"
					role="presentation"
				>
					<span
						class="pointer-events-none absolute top-1 bottom-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-card shadow-sm transition-transform duration-300 ease-out motion-reduce:transition-none"
						style={selectedIndex === 1 ? 'transform: translateX(100%)' : ''}
						aria-hidden="true"
					></span>
					{#each pricingModels as model (model.id)}
						<button
							type="button"
							class={[
								'relative z-10 rounded-full px-3 py-2 font-mono text-[0.6rem] tracking-[0.14em] uppercase transition-colors duration-300',
								selected === model.id ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
							].join(' ')}
							aria-pressed={selected === model.id}
							onclick={() => (selected = model.id)}
						>
							{model.meta}
						</button>
					{/each}
				</div>

				<!-- Plates: same click target as the track above, restated as full cards -->
				<div class="mt-4 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2">
					{#each pricingModels as model (model.id)}
						{@const isSelected = selected === model.id}
						{@const Icon = model.icon}
						<button
							type="button"
							class={[
								'group flex flex-col gap-4 p-6 text-left transition-colors duration-300 sm:p-8',
								isSelected ? 'bg-card' : 'bg-card/60 hover:bg-card'
							].join(' ')}
							aria-pressed={isSelected}
							onclick={() => (selected = model.id)}
						>
							<div class="flex items-start justify-between gap-4">
								<span
									class={[
										'flex size-10 items-center justify-center rounded-lg border transition-colors duration-300',
										isSelected
											? 'border-primary/30 bg-primary/10 text-primary'
											: 'border-border bg-muted text-muted-foreground'
									].join(' ')}
								>
									<Icon class="size-5" aria-hidden="true" />
								</span>
								<span
									class={[
										'flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-300',
										isSelected ? 'border-primary' : 'border-border'
									].join(' ')}
									aria-hidden="true"
								>
									{#if isSelected}
										<span class="size-1.5 rounded-full bg-primary"></span>
									{/if}
								</span>
							</div>

							<div>
								<h4
									class={[
										'font-serif text-xl font-medium tracking-tight sm:text-2xl',
										!isSelected && 'text-foreground/80'
									].join(' ')}
								>
									{model.title}
								</h4>
								<p class="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">
									{model.text}
								</p>
							</div>
						</button>
					{/each}
				</div>
			</div>
		</div>
	</div>
</Section>