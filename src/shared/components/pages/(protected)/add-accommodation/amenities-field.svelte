<script lang="ts">
	// UTILS
	import { cn } from '@/shared/utils/utils.js';

	// DATA
	import { AMENITIES } from '@/shared/data/amenitiesData';

	// LUCIDE ICONS
	import CheckIcon from '@lucide/svelte/icons/check';

	let {
		value,
		setValue
	}: {
		value: unknown;
		setValue: (next: unknown) => void;
	} = $props();

	const selected = $derived((value as string[] | undefined) ?? []);

	function toggle(id: string) {
		setValue(selected.includes(id) ? selected.filter((a) => a !== id) : [...selected, id]);
	}
</script>

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
					? 'border-primary bg-primary/10 text-primary font-medium'
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
