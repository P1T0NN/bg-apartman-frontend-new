<script lang="ts">
	// UTILS
	import {
		amenityIcon,
		amenityLabel
	} from '@/features/accommodations/utils/accommodationPresentation';

	let { amenities }: { amenities: string[] } = $props();

	// Show a trimmed set first; reveal the rest on demand to keep the page short.
	const INITIAL = 8;
	let showAll = $state(false);
	const visible = $derived(showAll ? amenities : amenities.slice(0, INITIAL));
	const hiddenCount = $derived(Math.max(0, amenities.length - INITIAL));
</script>

<section class="space-y-4">
	<h2 class="text-lg font-semibold tracking-tight">What this place offers</h2>

	<ul class="grid grid-cols-1 gap-x-6 gap-y-3.5 sm:grid-cols-2">
		{#each visible as id (id)}
			{@const Icon = amenityIcon(id)}
			<li class="flex items-center gap-3 text-sm">
				<Icon class="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
				<span>{amenityLabel(id)}</span>
			</li>
		{/each}
	</ul>

	{#if hiddenCount > 0 && !showAll}
		<button
			type="button"
			onclick={() => (showAll = true)}
			class="rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
		>
			Show all {amenities.length} amenities
		</button>
	{/if}
</section>
