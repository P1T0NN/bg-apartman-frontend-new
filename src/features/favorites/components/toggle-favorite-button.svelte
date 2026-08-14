<script lang="ts">
	import { m } from '@/lib/paraglide/messages';

	// LIBRARIES
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	// CLASSES
	import { favoritesClass } from '@/features/favorites/classes/favoritesClass.svelte';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { Id } from '@/convex/_generated/dataModel';

	// LUCIDE ICONS
	import HeartIcon from '@lucide/svelte/icons/heart';

	let {
		apartmentId,
		variant = 'toolbar',
		class: className
	}: {
		apartmentId: Id<'apartments'>;
		/** Ghost toolbar button (detail page) or image overlay (search card). */
		variant?: 'toolbar' | 'overlay';
		class?: string;
	} = $props();

	// Anonymous visitors only: loads their localStorage hearts the first time one mounts.
	// Idempotent, and a no-op for signed-in users — the root layout's single subscription is
	// what fills the set there, so mounting 30 of these still costs zero queries.
	onMount(() => {
		favoritesClass.hydrate();
	});

	const saved = $derived(favoritesClass.isFavorite(apartmentId));

	function handleToggleFavorite(event?: MouseEvent) {
		event?.preventDefault();
		event?.stopPropagation();

		const nowSaved = favoritesClass.toggle(apartmentId);

		toast.success(nowSaved ? m['FavoritesFeature.ToggleFavoriteButton.savedToList']() : m['FavoritesFeature.ToggleFavoriteButton.removedFromList']());
	}
</script>

{#if variant === 'overlay'}
	<button
		type="button"
		aria-label={saved ? m['FavoritesFeature.ToggleFavoriteButton.removeFromSaved']() : m['FavoritesFeature.ToggleFavoriteButton.save']()}
		aria-pressed={saved}
		onclick={handleToggleFavorite}
		class={cn(
			'absolute top-3 right-3 grid size-8 place-items-center rounded-full bg-background/70 text-foreground backdrop-blur transition hover:bg-background',
			className
		)}
	>
		<HeartIcon class={cn('size-4', saved && 'fill-red-500 text-red-500')} aria-hidden="true" />
	</button>
{:else}
	<Button
		variant="ghost"
		size="sm"
		onclick={handleToggleFavorite}
		aria-pressed={saved}
		class={className}
	>
		<HeartIcon class={cn('size-4', saved && 'fill-red-500 text-red-500')} aria-hidden="true" />

		<span class="hidden sm:inline">{saved ? m['FavoritesFeature.ToggleFavoriteButton.saved']() : m['FavoritesFeature.ToggleFavoriteButton.save']()}</span>
	</Button>
{/if}
