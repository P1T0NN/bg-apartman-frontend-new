<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';
	import {
		createPlacesSession,
		formatRegionLabel,
		REGION_PRIMARY_TYPES,
		CITY_PRIMARY_TYPES,
		type PlaceDetails,
		type PlaceSuggestion,
		type RegionBounds
	} from '@/shared/lib/google-maps/places';

	// COMPONENTS
	import { Input } from '@/shared/components/ui/input/index.js';
	import Spinner from '../spinner/spinner.svelte';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// LUCIDE ICONS
	import SearchIcon from '@lucide/svelte/icons/search';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';

	let {
		id,
		value = $bindable(''),
		placeholder,
		disabled = false,
		/** ISO-3166 country codes to bias/limit results, e.g. `['rs']`. */
		regionCodes,
		/** `address` — full street addresses. `region` — cities & countries (search). `city` — cities only. */
		variant = 'address',
		/** Restrict suggestions to this bbox (e.g. a picked city/country's viewport). */
		locationRestriction,
		minLength = 3,
		onSelect,
		/** Fires on every manual keystroke (not on programmatic select) — lets a caller invalidate a
		 *  previously chosen place id the moment the text is edited, so only a real pick counts. */
		onInput
	}: {
		id?: string;
		value?: string;
		placeholder?: string;
		disabled?: boolean;
		regionCodes?: string[];
		variant?: 'address' | 'region' | 'city';
		locationRestriction?: RegionBounds;
		minLength?: number;
		onSelect?: (place: PlaceDetails) => void;
		onInput?: (value: string) => void;
	} = $props();

	// svelte-ignore state_referenced_locally
	const session = createPlacesSession({
		regionCodes,
		includedPrimaryTypes:
			variant === 'region'
				? REGION_PRIMARY_TYPES
				: variant === 'city'
					? CITY_PRIMARY_TYPES
					: undefined,
		// Only listing addresses need a timezone; region/city search doesn't.
		resolveTimeZone: variant === 'address'
	});

	const resolvedPlaceholder = $derived(
		placeholder ??
			(variant === 'address'
				? m['PlacesAutocomplete.placeholder']()
				: m['PlacesAutocomplete.regionPlaceholder']())
	);

	let suggestions = $state<PlaceSuggestion[]>([]);
	let open = $state(false);
	let loading = $state(false);
	let errorMsg = $state<string | null>(null);
	let activeIndex = $state(-1);

	let debounce: ReturnType<typeof setTimeout> | undefined;
	let requestSeq = 0;

	// svelte-ignore state_referenced_locally
	const listboxId = `${id ?? 'places'}-listbox`;

	// Chrome ignores `autocomplete="off"` on address-like fields (label/placeholder say "city")
	// and overlays its own autofill + form-history dropdown on top of ours. `new-password` is the
	// reliable opt-out for a text input — Chrome won't autofill or show history, and (being text,
	// not a password field) shows no password UI. The unique name + `data-*` opt-outs below stop
	// Chrome correlating a saved address and silence 1Password / LastPass.
	const uid = $props.id();
	const fieldName = `places-${uid}`;

	// True once a search has completed with no matches (so we can say so rather
	// than render nothing, which looks like the integration is broken).
	const showEmpty = $derived(
		open && !loading && !errorMsg && suggestions.length === 0 && value.trim().length >= minLength
	);

	function handleInput(next: string) {
		value = next;
		// A manual edit invalidates any previously selected place — tell the caller so it can clear
		// the stored id (selecting from the list re-sets it).
		onInput?.(next);
		errorMsg = null;
		activeIndex = -1;
		clearTimeout(debounce);

		const trimmed = next.trim();
		if (trimmed.length < minLength) {
			suggestions = [];
			open = false;
			loading = false;
			return;
		}

		loading = true;
		open = true;
		debounce = setTimeout(() => void runSearch(trimmed), 250);
	}

	async function runSearch(input: string) {
		const seq = ++requestSeq;
		try {
			const results = await session.search(
				input,
				locationRestriction ? { locationRestriction } : undefined
			);
			if (seq !== requestSeq) return; // a newer keystroke superseded this one
			suggestions = results;
			open = true;
		} catch (err) {
			if (seq !== requestSeq) return;
			console.error('[places-autocomplete] suggestion fetch failed:', err);
			suggestions = [];
			errorMsg = err instanceof Error ? err.message : 'Could not load address suggestions.';
		} finally {
			if (seq === requestSeq) loading = false;
		}
	}

	async function choose(suggestion: PlaceSuggestion) {
		value = suggestion.secondaryText
			? `${suggestion.primaryText}, ${suggestion.secondaryText}`
			: suggestion.primaryText;
		open = false;
		suggestions = [];

		try {
			const details = await session.select(suggestion.placeId);
			if (details) {
				value =
					variant === 'address' ? details.formattedAddress || value : formatRegionLabel(details);
				onSelect?.(details);
			}
		} catch (err) {
			errorMsg = err instanceof Error ? err.message : m['PlacesAutocomplete.error']();
		}
	}

	function onKeydown(event: KeyboardEvent) {
		if (!open || suggestions.length === 0) return;

		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				activeIndex = (activeIndex + 1) % suggestions.length;
				break;
			case 'ArrowUp':
				event.preventDefault();
				activeIndex = (activeIndex - 1 + suggestions.length) % suggestions.length;
				break;
			case 'Enter':
				if (activeIndex >= 0) {
					event.preventDefault();
					void choose(suggestions[activeIndex]);
				}
				break;
			case 'Escape':
				open = false;
				break;
		}
	}
</script>

<div class="relative">
	<SearchIcon
		class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
	/>
	<Input
		{id}
		{disabled}
		placeholder={resolvedPlaceholder}
		class="pl-9"
		{value}
		role="combobox"
		aria-expanded={open}
		aria-controls={listboxId}
		aria-autocomplete="list"
		name={fieldName}
		autocomplete="new-password"
		autocorrect="off"
		autocapitalize="none"
		spellcheck={false}
		data-1p-ignore
		data-lpignore="true"
		data-form-type="other"
		oninput={(e) => handleInput(e.currentTarget.value)}
		onkeydown={onKeydown}
		onfocus={() => {
			if (suggestions.length > 0) open = true;
		}}
		onblur={() => setTimeout(() => (open = false), 120)}
	/>

	{#if loading}
		<LoaderCircleIcon
			class="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
		/>
	{/if}

	{#if open && (loading || suggestions.length > 0 || errorMsg || showEmpty)}
		<ul
			id={listboxId}
			role="listbox"
			class="absolute z-50 mt-1 max-h-72 w-full overflow-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-md"
		>
			{#if errorMsg}
				<li class="px-3 py-2 text-sm text-destructive">{errorMsg}</li>
			{:else if suggestions.length === 0 && loading}
				<li class="px-3 py-2 text-sm text-muted-foreground"><Spinner /></li>
			{:else if suggestions.length === 0}
				<li class="px-3 py-2 text-sm text-muted-foreground">
					{m['PlacesAutocomplete.noMatches']()}
				</li>
			{:else}
				{#each suggestions as suggestion, i (suggestion.placeId)}
					<li role="option" aria-selected={i === activeIndex}>
						<button
							type="button"
							class={cn(
								'flex w-full items-start gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors',
								i === activeIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
							)}
							onmousedown={(e) => e.preventDefault()}
							onclick={() => void choose(suggestion)}
						>
							<MapPinIcon class="mt-0.5 size-4 shrink-0 text-muted-foreground" />
							<span class="min-w-0">
								<span class="block truncate font-medium">{suggestion.primaryText}</span>
								{#if suggestion.secondaryText}
									<span class="block truncate text-xs text-muted-foreground">
										{suggestion.secondaryText}
									</span>
								{/if}
							</span>
						</button>
					</li>
				{/each}
			{/if}
		</ul>
	{/if}
</div>
