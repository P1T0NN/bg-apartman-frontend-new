<script lang="ts">
	// I18N
	import { m } from '@/lib/paraglide/messages';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// DATA
	import { AMENITIES } from '@/features/amenities/data/amenitiesData';

	// SCHEMAS
	import { MIN_ACCOMMODATION_AMENITIES } from '@/shared/features/accommodation/schemas/accommodationsSchemas';

	// LUCIDE ICONS
	import CheckIcon from '@lucide/svelte/icons/check';

	let {
		value,
		setValue,
		invalid = false
	}: {
		value: unknown;
		setValue: (next: unknown) => void;
		invalid?: boolean;
	} = $props();

	const selected = $derived((value as string[] | undefined) ?? []);
	const count = $derived(selected.length);
	const complete = $derived(count >= MIN_ACCOMMODATION_AMENITIES);

	function toggle(id: string) {
		setValue(selected.includes(id) ? selected.filter((a) => a !== id) : [...selected, id]);
	}
</script>

<!-- Progress counter: green once the minimum is met, red while it's still required + invalid. -->
<div class="mb-3 flex items-center justify-between">
	<span class="text-xs text-muted-foreground">
		{m['HostAddAccommodationPage.AmenitiesField.pickAtLeast']({ count: MIN_ACCOMMODATION_AMENITIES })}
	</span>
	<span
		class={cn(
			'rounded-full px-2 py-0.5 text-xs font-medium tabular-nums',
			complete
				? 'bg-primary/10 text-primary'
				: invalid
					? 'bg-destructive/10 text-destructive'
					: 'bg-muted text-muted-foreground'
		)}
	>
		{count}/{MIN_ACCOMMODATION_AMENITIES}
		{#if complete}
			{m['HostAddAccommodationPage.AmenitiesField.selected']()}
		{/if}
	</span>
</div>

<div class="flex flex-wrap gap-2">
	{#each AMENITIES as amenity (amenity.id)}
		{@const on = selected.includes(amenity.id)}
		<button
			type="button"
			onclick={() => toggle(amenity.id)}
			aria-pressed={on}
			class={cn(
				'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors',
				on
					? 'border-primary bg-primary/10 font-medium text-primary'
					: 'border-border text-foreground hover:bg-muted'
			)}
		>
			{#if on}
				<CheckIcon class="size-3.5" />
			{/if}
			{amenity.label}
		</button>
	{/each}
</div>
