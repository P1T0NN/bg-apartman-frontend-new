<script lang="ts">
	// LIBRARIES
	import { goto } from '$app/navigation';
	import { getLocalTimeZone, today } from '@internationalized/date';
	import { createSerializer, parseAsString } from 'nuqs-svelte';
	import type { DateRange } from 'bits-ui';

	// COMPONENTS
	import { Input } from '@/shared/components/ui/input/index.js';
	import { Label } from '@/shared/components/ui/label/index.js';
	import { Button } from '@/shared/components/ui/button/index.js';
	import * as Popover from '@/shared/components/ui/popover/index.js';
	import { RangeCalendar } from '@/shared/components/ui/range-calendar/index.js';
	import * as Select from '@/shared/components/ui/select/index.js';

	// LUCIDE ICONS
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import SearchIcon from '@lucide/svelte/icons/search';

	const countOptions = [
		{ value: 'any', label: 'Any' },
		{ value: '1', label: '1' },
		{ value: '2', label: '2' },
		{ value: '3', label: '3' },
		{ value: '4+', label: '4+' }
	];

	let location = $state('');
	let dates = $state<DateRange | undefined>();
	let bedrooms = $state<string | undefined>();
	let bathrooms = $state<string | undefined>();
	let guests = $state<string | undefined>();

	let datesOpen = $state(false);

	const tz = getLocalTimeZone();

	const datesLabel = $derived.by(() => {
		if (!dates?.start) return 'Stay dates';
		const start = dates.start.toDate(tz).toLocaleDateString();
		if (!dates.end) return start;
		return `${start} – ${dates.end.toDate(tz).toLocaleDateString()}`;
	});

	const bedroomsLabel = $derived(countOptions.find((o) => o.value === bedrooms)?.label);
	const bathroomsLabel = $derived(countOptions.find((o) => o.value === bathrooms)?.label);
	const guestsLabel = $derived(countOptions.find((o) => o.value === guests)?.label);

	// nuqs serializer: turns values into a `/search?...` query string.
	const serializeSearch = createSerializer({
		location: parseAsString,
		checkIn: parseAsString,
		checkOut: parseAsString,
		bedrooms: parseAsString,
		bathrooms: parseAsString,
		guests: parseAsString
	});

	// Empty/untouched and the "any" no-filter option both mean "leave it out of the URL".
	// `?? null` wouldn't cut it: the Select hands back '' (not nullish) when untouched.
	const filter = (value?: string) => (value && value !== 'any' ? value : null);

	function handleSearch() {
		const url = serializeSearch('/search', {
			location: location.trim() || null,
			checkIn: dates?.start?.toString() ?? null,
			checkOut: dates?.end?.toString() ?? null,
			bedrooms: filter(bedrooms),
			bathrooms: filter(bathrooms),
			guests: filter(guests)
		});

		goto(url);
	}
</script>

<div class="flex min-h-screen items-center justify-center p-4">
	<div class="w-full max-w-sm space-y-5 rounded-xl border bg-card p-6 shadow-sm">
		<!-- Location -->
		<div class="space-y-2">
			<Label for="location">Location</Label>
			<Input id="location" placeholder="Where to?" bind:value={location} />
		</div>

		<!-- Stay Dates -->
		<div class="space-y-2">
			<Label>Stay Dates</Label>
			<Popover.Root bind:open={datesOpen}>
				<Popover.Trigger>
					{#snippet child({ props })}
						<Button {...props} variant="outline" class="w-full justify-between font-normal">
							<span class={dates?.start ? '' : 'text-muted-foreground'}>
								{datesLabel}
							</span>
							<CalendarIcon class="size-4 opacity-60" />
						</Button>
					{/snippet}
				</Popover.Trigger>
				<Popover.Content class="w-auto overflow-hidden p-0" align="start">
					<RangeCalendar bind:value={dates} minValue={today(tz)} />
				</Popover.Content>
			</Popover.Root>
		</div>

		<!-- Bedrooms -->
		<div class="space-y-2">
			<Label>Bedrooms</Label>
			<Select.Root type="single" bind:value={bedrooms}>
				<Select.Trigger class="w-full">
					<span class={bedrooms ? '' : 'text-muted-foreground'}>
						{bedroomsLabel ?? 'Any'}
					</span>
				</Select.Trigger>
				<Select.Content>
					{#each countOptions as option (option.value)}
						<Select.Item value={option.value} label={option.label} />
					{/each}
				</Select.Content>
			</Select.Root>
		</div>

		<!-- Bathrooms -->
		<div class="space-y-2">
			<Label>Bathrooms</Label>
			<Select.Root type="single" bind:value={bathrooms}>
				<Select.Trigger class="w-full">
					<span class={bathrooms ? '' : 'text-muted-foreground'}>
						{bathroomsLabel ?? 'Any'}
					</span>
				</Select.Trigger>
				<Select.Content>
					{#each countOptions as option (option.value)}
						<Select.Item value={option.value} label={option.label} />
					{/each}
				</Select.Content>
			</Select.Root>
		</div>

		<!-- Guests -->
		<div class="space-y-2">
			<Label>Guests</Label>
			<Select.Root type="single" bind:value={guests}>
				<Select.Trigger class="w-full">
					<span class={guests ? '' : 'text-muted-foreground'}>
						{guestsLabel ?? 'Any'}
					</span>
				</Select.Trigger>
				<Select.Content>
					{#each countOptions as option (option.value)}
						<Select.Item value={option.value} label={option.label} />
					{/each}
				</Select.Content>
			</Select.Root>
		</div>

		<!-- Search -->
		<Button class="w-full" onclick={handleSearch}>
			<SearchIcon class="size-4" />
			Search
		</Button>
	</div>
</div>
