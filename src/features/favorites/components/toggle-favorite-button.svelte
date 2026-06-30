<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	// CLASSES
	import { favoritesClass } from '@/features/favorites/classes/favoritesClass.svelte';

	// COMPONENTS
	import { Button } from '@/shared/components/ui/button/index.js';

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

	// Load persisted favorites from localStorage the first time any heart mounts. Idempotent
	// + client-only, so each card/detail button can own the check without layout coupling.
	onMount(() => {
		favoritesClass.hydrate();
	});

	const saved = $derived(favoritesClass.isFavorite(apartmentId));

	function handleToggleFavorite(event?: MouseEvent) {
		event?.preventDefault();
		event?.stopPropagation();

		const nowSaved = favoritesClass.toggle(apartmentId);

		toast.success(
			nowSaved ? m['ToggleFavoriteButton.savedMessage']() : m['ToggleFavoriteButton.removedMessage']()
		);
	}
</script>

{#if variant === 'overlay'}
	<button
		type="button"
		aria-label={saved ? m['ToggleFavoriteButton.removeFromSaved']() : m['ToggleFavoriteButton.save']()}
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
	<Button variant="ghost" size="sm" onclick={handleToggleFavorite} aria-pressed={saved} class={className}>
		<HeartIcon class={cn('size-4', saved && 'fill-red-500 text-red-500')} aria-hidden="true" />

		<span class="hidden sm:inline">{saved ? m['ToggleFavoriteButton.saved']() : m['ToggleFavoriteButton.save']()}</span>
	</Button>
{/if}
