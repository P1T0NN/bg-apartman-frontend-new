<script lang="ts">
	// SVELTEKIT
	import { goto } from '$app/navigation';

	// LIBRARIES
	import { getLocalTimeZone, today } from '@internationalized/date';
	import { createSerializer, parseAsString } from 'nuqs-svelte';
	import { toast } from 'svelte-sonner';
	import { formatRegionLabel, type PlaceDetails } from '@/shared/lib/google-maps/places';
	import { localizeHref } from '@/shared/lib/paraglide/runtime';

	// COMPONENTS
	import { Button } from '@/shared/components/ui/button/index.js';
	import PlacesAutocomplete from '@/shared/components/ui/places-autocomplete/places-autocomplete.svelte';
	import { FieldError } from '@/shared/components/ui/field/index.js';
	import { NativePopover } from '@/shared/components/ui/native-popover/index.js';
	import { RangeCalendar } from '@/shared/components/ui/range-calendar/index.js';
	import { NativeSelect } from '@/shared/components/ui/select/index.js';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { DateRange } from 'bits-ui';

	// LUCIDE ICONS
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import SearchIcon from '@lucide/svelte/icons/search';

	const guestOptions = [
		{ value: 'any', label: 'Any' },
		{ value: '1', label: '1 guest' },
		{ value: '2', label: '2 guests' },
		{ value: '3', label: '3 guests' },
		{ value: '4+', label: '4+ guests' }
	];

	// Only the location is required — dates and guests narrow a search that can run without them.
	const LOCATION_REQUIRED = 'Please enter a location to search.';

	let location = $state('');
	let locationPlaceId = $state('');
	let locationLabel = $state('');
	let locationError = $state('');
	let dates = $state<DateRange | undefined>();
	let guests = $state('any');

	const tz = getLocalTimeZone();

	const datesLabel = $derived.by(() => {
		if (!dates?.start) return 'Add dates';
		const opts = { month: 'short', day: 'numeric' } as const;
		const start = dates.start.toDate(tz).toLocaleDateString(undefined, opts);
		if (!dates.end) return start;
		return `${start} – ${dates.end.toDate(tz).toLocaleDateString(undefined, opts)}`;
	});

	const serializeSearch = createSerializer({
		location: parseAsString,
		placeId: parseAsString,
		checkIn: parseAsString,
		checkOut: parseAsString,
		guests: parseAsString
	});

	const filter = (value?: string) => (value && value !== 'any' ? value : null);

	function handlePlaceSelect(place: PlaceDetails) {
		locationPlaceId = place.placeId;
		locationLabel = formatRegionLabel(place);
	}

	function handleSearch() {
		const trimmed = location.trim();

		if (!trimmed) {
			locationError = LOCATION_REQUIRED;
			toast.error(LOCATION_REQUIRED);
			document.getElementById('hero-location')?.focus();
			return;
		}

		locationError = '';
		const placeId = trimmed === locationLabel ? locationPlaceId || null : null;

		const url = serializeSearch(localizeHref('/search'), {
			location: trimmed || null,
			placeId,
			checkIn: dates?.start?.toString() ?? null,
			checkOut: dates?.end?.toString() ?? null,
			guests: filter(guests)
		});

		goto(url);
	}
</script>

<div
	class={cn(
		'hero-card rounded-2xl bg-dark-elevated/90 p-4 shadow-2xl backdrop-blur-md lg:rounded-3xl lg:p-6',
		// The error hangs out of flow on desktop, so the card makes the room for it instead of the row.
		locationError && 'lg:pb-12'
	)}
>
	<div class="grid gap-3 lg:grid-cols-4 lg:gap-4">
		<!-- Where -->
		<div class="relative">
			<div
				class={cn(
					'hero-field h-full cursor-text rounded-xl bg-hero-overlay-foreground/5 px-3 py-2',
					locationError && 'ring-2 ring-destructive/50'
				)}
			>
				<span
					class="mb-0.5 block text-[0.65rem] font-medium tracking-wider text-muted-foreground uppercase"
				>
					Where
				</span>
				<PlacesAutocomplete
					id="hero-location"
					variant="region"
					placeholder="Where are you going?"
					bind:value={location}
					onSelect={handlePlaceSelect}
					onInput={() => (locationError = '')}
				/>
			</div>

			<!-- Stacked on mobile the error can push its siblings down; side by side on desktop it would
			     instead grow the row and stretch them taller, so there it sits out of flow. -->
			{#if locationError}
				<FieldError class="mt-1.5 px-1 lg:absolute lg:inset-x-0 lg:top-full lg:mt-1">
					{locationError}
				</FieldError>
			{/if}
		</div>

		<!-- When -->
		<div class="rounded-xl bg-hero-overlay-foreground/5 px-3 py-2">
			<span
				class="mb-0.5 block text-[0.65rem] font-medium tracking-wider text-muted-foreground uppercase"
			>
				When
			</span>
			<NativePopover align="start" contentClass="w-auto overflow-hidden p-0">
				{#snippet trigger({ props, anchorStyle })}
					<Button
						{...props}
						style={anchorStyle}
						variant="ghost"
						class="h-auto w-full justify-between p-0 text-sm font-medium text-dark-elevated-foreground hover:bg-transparent hover:text-dark-elevated-foreground"
					>
						<span class={dates?.start ? '' : 'text-muted-foreground'}>{datesLabel}</span>
						<CalendarIcon class="size-4 text-muted-foreground" />
					</Button>
				{/snippet}
				{#snippet content({ close })}
					<RangeCalendar
						bind:value={dates}
						minValue={today(tz)}
						onValueChange={(range) => {
							// Range complete → close the popover so the user doesn't have to click away.
							if (range?.start && range?.end) close();
						}}
					/>
				{/snippet}
			</NativePopover>
		</div>

		<!-- Guests -->
		<div class="rounded-xl bg-hero-overlay-foreground/5 px-3 py-2">
			<span
				class="mb-0.5 block text-[0.65rem] font-medium tracking-wider text-muted-foreground uppercase"
			>
				Guests
			</span>
			<NativeSelect
				bind:value={guests}
				options={guestOptions}
				class="min-h-0 border-0 bg-transparent p-0 pr-8 text-sm font-medium text-dark-elevated-foreground focus-visible:border-0 focus-visible:ring-0"
			/>
		</div>

		<!-- Search -->
		<Button
			class="flex h-full min-h-11 items-center justify-center gap-2 rounded-xl px-6 py-2 text-sm font-semibold transition-all hover:opacity-90 lg:min-h-0"
			onclick={handleSearch}
		>
			<SearchIcon class="size-5" />
			Search
		</Button>
	</div>
</div>

<style>
	/* PlacesAutocomplete renders its own <Input>; strip its chrome so it reads as part of
	   the field box rather than a nested control. Its leading search icon goes with the
	   padding it sat in — the Search button already carries that affordance. */
	.hero-field :global(div > svg:first-child) {
		display: none;
	}

	.hero-field :global(input) {
		height: auto;
		min-height: 0;
		padding: 0;
		border: 0;
		background: transparent;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--dark-elevated-foreground);
		box-shadow: none;
	}

	.hero-field :global(input:focus-visible) {
		outline: none;
		box-shadow: none;
	}

	@keyframes heroCardUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	.hero-card {
		animation: heroCardUp 0.6s ease-out 300ms both;
	}

	@media (prefers-reduced-motion: reduce) {
		.hero-card {
			animation: none;
		}
	}
</style>
