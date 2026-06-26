<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';
	
	// COMPONENTS
	import ToggleFavoriteButton from '@/features/favorites/components/toggle-favorite-button.svelte';
	import ShareButton from '@/shared/components/ui/share-button/share-button.svelte';
	import AccommodationOverviewItem from './accommodation-overview-item.svelte';
	import SuperhostBadge from '@/features/accommodations/components/superhost-badge.svelte';

	// UTILS
	import { accommodationTypeLabel } from '@/features/accommodations/utils/accommodationPresentation';
	import {
		formatGuests,
		formatBedrooms,
		formatBathrooms,
		formatSquareMeters
	} from '@/shared/utils/formatters';

	// TYPES
	import type { AccommodationDetail } from '@/features/accommodations/data/accommodationDummyData';
	import type { Id } from '@/convex/_generated/dataModel';

	// LUCIDE ICONS
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import UsersIcon from '@lucide/svelte/icons/users';
	import BedDoubleIcon from '@lucide/svelte/icons/bed-double';
	import BathIcon from '@lucide/svelte/icons/bath';
	import ScalingIcon from '@lucide/svelte/icons/scaling';

	let { accommodation }: { accommodation: AccommodationDetail } = $props();

	const facts = $derived([
		{ icon: UsersIcon, label: formatGuests(accommodation.maxGuests) },
		{ icon: BedDoubleIcon, label: formatBedrooms(accommodation.bedrooms) },
		{ icon: BathIcon, label: formatBathrooms(accommodation.bathrooms) },
		{ icon: ScalingIcon, label: formatSquareMeters(accommodation.squareMeters) }
	]);

	const joinedYear = $derived(new Date(accommodation.host.joinedAt).getFullYear());
</script>

<div class="flex flex-col gap-3">
	<div class="flex items-start justify-between gap-4">
		<div class="min-w-0 space-y-1">
			<h1 class="text-2xl font-semibold tracking-tight md:text-3xl">{accommodation.title}</h1>
			<p class="flex items-center gap-1.5 text-sm text-muted-foreground">
				<MapPinIcon class="size-4 shrink-0" aria-hidden="true" />
				{accommodationTypeLabel(accommodation.type)} {m['AccommodationPage.AccommodationOverview.in']()} {accommodation.city}{#if accommodation.country}, {accommodation.country}{/if}
			</p>
		</div>

		<div class="flex shrink-0 items-center gap-1">
			<ShareButton title={accommodation.title} />

			<ToggleFavoriteButton apartmentId={accommodation._id as Id<'apartments'>} />
		</div>
	</div>

	<div class="space-y-4">
		<div class="flex flex-wrap items-center gap-x-4 gap-y-2">
			{#each facts as fact (fact.label)}
				<AccommodationOverviewItem icon={fact.icon} label={fact.label} />
			{/each}
		</div>

		<div class="rounded-2xl border p-5 sm:p-6">
			<div class="flex items-center gap-4">
				{#if accommodation.host.avatarUrl}
					<img
						src={accommodation.host.avatarUrl}
						alt={accommodation.host.name}
						class="size-16 rounded-full object-cover ring-1 ring-border"
						loading="lazy"
					/>
				{/if}

				<div class="space-y-1">
					<p class="text-lg font-semibold">{accommodation.host.name}</p>

					{#if accommodation.host.isSuperhost}
						<SuperhostBadge variant="subtitle" />
					{/if}

					<p class="text-sm text-muted-foreground">
						{m['AccommodationPage.AccommodationHostSection.hostingSince']()}
						{joinedYear}
					</p>
				</div>
			</div>
		</div>
	</div>
</div>
