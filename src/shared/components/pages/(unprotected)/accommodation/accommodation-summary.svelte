<script lang="ts">
	// COMPONENTS
	import { Separator } from '@/shared/components/ui/separator/index.js';

	// UTILS
	import { cn } from '@/shared/utils/utils.js';

	// LUCIDE ICONS
	import ZapIcon from '@lucide/svelte/icons/zap';
	import KeyRoundIcon from '@lucide/svelte/icons/key-round';
	import AwardIcon from '@lucide/svelte/icons/award';
	import DogIcon from '@lucide/svelte/icons/dog';
	import CarIcon from '@lucide/svelte/icons/car';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';

	// TYPES
	import type { Component } from 'svelte';
	import type { AccommodationDetail } from '@/features/accommodations/data/accommodationDummyData';

	let { accommodation }: { accommodation: AccommodationDetail } = $props();

	let expanded = $state(false);

	type Highlight = { icon: Component; title: string; text: string };

	const highlights = $derived.by<Highlight[]>(() => {
		const out: Highlight[] = [];
		if (accommodation.instantBooking) {
			out.push({
				icon: ZapIcon,
				title: 'Instant booking',
				text: 'Your dates are confirmed straight away — no waiting for approval.'
			});
		}
		if (accommodation.amenities.includes('self_checkin')) {
			out.push({
				icon: KeyRoundIcon,
				title: 'Self check-in',
				text: 'Let yourself in any time with the keypad — no meet-up needed.'
			});
		}
		if (accommodation.host.isSuperhost) {
			out.push({
				icon: AwardIcon,
				title: `${accommodation.host.name} is a Superhost`,
				text: 'Superhosts are experienced, highly rated hosts committed to great stays.'
			});
		}
		if (accommodation.petsAllowed) {
			out.push({
				icon: DogIcon,
				title: 'Pets are welcome',
				text: 'Travelling with a furry friend? Just let the host know in advance.'
			});
		}
		if (accommodation.amenities.includes('free_parking')) {
			out.push({
				icon: CarIcon,
				title: 'Free parking on site',
				text: 'Leave the car right outside, at no extra cost.'
			});
		}
		return out.slice(0, 3);
	});
</script>

<section class="space-y-6">
	<!-- Hosted by -->
	<div class="flex items-center gap-3">
		{#if accommodation.host.avatarUrl}
			<img
				src={accommodation.host.avatarUrl}
				alt={accommodation.host.name}
				class="size-11 rounded-full object-cover ring-1 ring-border"
				loading="lazy"
			/>
		{/if}
		<div>
			<p class="text-base font-semibold">Hosted by {accommodation.host.name}</p>
			<p class="text-sm text-muted-foreground">
				Superhost · {accommodation.bedrooms}-bedroom {accommodation.type}
			</p>
		</div>
	</div>

	{#if highlights.length > 0}
		<Separator />
		<ul class="space-y-4">
			{#each highlights as highlight (highlight.title)}
				{@const Icon = highlight.icon}
				<li class="flex items-start gap-4">
					<Icon class="mt-0.5 size-6 shrink-0 text-foreground" aria-hidden="true" />
					<div class="space-y-0.5">
						<p class="text-sm font-medium">{highlight.title}</p>
						<p class="text-sm leading-relaxed text-muted-foreground">{highlight.text}</p>
					</div>
				</li>
			{/each}
		</ul>
	{/if}

	<Separator />

	<!-- Description -->
	<div class="space-y-2">
		<p
			class={cn(
				'text-sm leading-relaxed whitespace-pre-line text-foreground/90',
				!expanded && 'line-clamp-5'
			)}
		>
			{accommodation.description}
		</p>
		<button
			type="button"
			onclick={() => (expanded = !expanded)}
			class="inline-flex items-center gap-1 text-sm font-medium underline underline-offset-4 hover:text-foreground"
		>
			{expanded ? 'Show less' : 'Show more'}
			<ChevronDownIcon class={cn('size-4 transition-transform', expanded && 'rotate-180')} aria-hidden="true" />
		</button>
	</div>
</section>
