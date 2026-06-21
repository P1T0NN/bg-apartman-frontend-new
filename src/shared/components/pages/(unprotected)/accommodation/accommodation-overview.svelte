<script lang="ts">
	// LIBRARIES
	import { toast } from 'svelte-sonner';

	// COMPONENTS
	import { Button } from '@/shared/components/ui/button/index.js';

	// UTILS
	import { cn } from '@/shared/utils/utils.js';
	import { accommodationTypeLabel } from '@/features/accommodations/utils/accommodationPresentation';

	// LUCIDE ICONS
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import UsersIcon from '@lucide/svelte/icons/users';
	import BedDoubleIcon from '@lucide/svelte/icons/bed-double';
	import BathIcon from '@lucide/svelte/icons/bath';
	import ScalingIcon from '@lucide/svelte/icons/scaling';
	import ShareIcon from '@lucide/svelte/icons/share';
	import HeartIcon from '@lucide/svelte/icons/heart';
	import AwardIcon from '@lucide/svelte/icons/award';

	// TYPES
	import type { AccommodationDetail } from '@/features/accommodations/data/accommodationDummyData';

	let { accommodation }: { accommodation: AccommodationDetail } = $props();

	let saved = $state(false);

	const facts = $derived([
		{ icon: UsersIcon, label: `${accommodation.maxGuests} guests` },
		{
			icon: BedDoubleIcon,
			label: `${accommodation.bedrooms} ${accommodation.bedrooms === 1 ? 'bedroom' : 'bedrooms'}`
		},
		{
			icon: BathIcon,
			label: `${accommodation.bathrooms} ${accommodation.bathrooms === 1 ? 'bathroom' : 'bathrooms'}`
		},
		{ icon: ScalingIcon, label: `${accommodation.squareMeters} m²` }
	]);

	function toggleSave() {
		saved = !saved;
		toast.success(saved ? 'Saved to your list' : 'Removed from your list');
	}

	async function share() {
		const url = typeof window !== 'undefined' ? window.location.href : '';
		try {
			if (navigator.share) {
				await navigator.share({ title: accommodation.title, url });
				return;
			}
			await navigator.clipboard.writeText(url);
			toast.success('Link copied to clipboard');
		} catch {
			/* user dismissed the share sheet — nothing to do */
		}
	}
</script>

<div class="flex flex-col gap-3">
	<div class="flex items-start justify-between gap-4">
		<div class="min-w-0 space-y-1">
			<h1 class="text-2xl font-semibold tracking-tight md:text-3xl">{accommodation.title}</h1>
			<p class="flex items-center gap-1.5 text-sm text-muted-foreground">
				<MapPinIcon class="size-4 shrink-0" aria-hidden="true" />
				{accommodationTypeLabel(accommodation.type)} in {accommodation.city}{accommodation.country
					? `, ${accommodation.country}`
					: ''}
			</p>
		</div>

		<div class="flex shrink-0 items-center gap-1">
			<Button variant="ghost" size="sm" onclick={share}>
				<ShareIcon class="size-4" aria-hidden="true" />
				<span class="hidden sm:inline">Share</span>
			</Button>
			<Button variant="ghost" size="sm" onclick={toggleSave} aria-pressed={saved}>
				<HeartIcon
					class={cn('size-4', saved && 'fill-red-500 text-red-500')}
					aria-hidden="true"
				/>
				<span class="hidden sm:inline">{saved ? 'Saved' : 'Save'}</span>
			</Button>
		</div>
	</div>

	<div class="flex flex-wrap items-center gap-x-4 gap-y-2">
		{#each facts as fact (fact.label)}
			{@const Icon = fact.icon}
			<span class="flex items-center gap-1.5 text-sm text-foreground">
				<Icon class="size-4 text-muted-foreground" aria-hidden="true" />
				{fact.label}
			</span>
		{/each}

		{#if accommodation.host.isSuperhost}
			<span
				class="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-500/20 dark:text-amber-300"
			>
				<AwardIcon class="size-3.5" aria-hidden="true" />
				Superhost
			</span>
		{/if}
	</div>
</div>
