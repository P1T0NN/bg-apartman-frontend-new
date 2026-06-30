<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { m } from '@/shared/lib/paraglide/messages';

	// CONFIG
	import { PAGINATION_DATA } from '@/shared/config';

	// CLASSES
	import { favoritesClass } from '@/features/favorites/classes/favoritesClass.svelte';

	// COMPONENTS
	import SvelteHead from '@/shared/components/ui/svelte-head/svelte-head.svelte';
	import AccommodationCard from '@/features/accommodations/components/accommodation-card/accommodation-card.svelte';
	import ConvexDataList from '@/shared/components/ui/data-list/convex-data-list.svelte';
	import FavoritesPageLoading from '@/shared/components/pages/(protected)/guest/favorites/loading/favorites-page-loading.svelte';
	import FavoritesPageEmpty from '@/shared/components/pages/(protected)/guest/favorites/empty/favorites-page-empty.svelte';

	// UTILS
	import { formatPlaces } from '@/utils/formatters';

	// TYPES
	import type { Id } from '@/convex/_generated/dataModel';
	import type { SearchListing } from '@/shared/features/accommodation/types/accommodationTypes';

	// This page reads the favorites set directly (no heart mounts first), so hydrate here too.
	// Idempotent + client-only — a no-op if a card already triggered it.
	$effect(() => {
		favoritesClass.hydrate();
	});

	const favoriteIds = $derived([...favoritesClass.ids] as Id<'apartments'>[]);
	const hasSavedIds = $derived(favoriteIds.length > 0);
</script>

<SvelteHead
	title={m['FavoritesPage.title']()}
	description={m['FavoritesPage.metaDescription']()}
	noIndex
/>

<section class="flex w-full flex-col gap-6 p-4 md:p-6">
	<header class="flex flex-col gap-1 border-b pb-5">
		<h1 class="text-2xl font-semibold tracking-tight md:text-3xl">{m['FavoritesPage.title']()}</h1>
		<p class="max-w-2xl text-sm leading-relaxed text-muted-foreground">
			{#if hasSavedIds}
				{m['FavoritesPage.savedPlacesSubtitle']({ places: formatPlaces(favoriteIds.length) })}
			{:else}
				{m['FavoritesPage.subtitleDefault']()}
			{/if}
		</p>
	</header>

	{#if hasSavedIds}
		<ConvexDataList
			query={api.tables.accommodations.queries.fetchFavoriteAccommodationsSafe.fetchFavoriteAccommodationsSafe}
			queryArgs={{ ids: favoriteIds }}
			optimizationStrategy="offset"
			pageSize={PAGINATION_DATA.DEFAULT_PAGE_SIZE}
			listClass="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3"
			getItemKey={(listing) => (listing as SearchListing).id}
		>
			{#snippet item({ item })}
				<AccommodationCard listing={item as SearchListing} />
			{/snippet}

			{#snippet loading()}
				<FavoritesPageLoading />
			{/snippet}

			{#snippet empty()}
				<FavoritesPageEmpty />
			{/snippet}
		</ConvexDataList>
	{:else}
		<FavoritesPageEmpty />
	{/if}
</section>
