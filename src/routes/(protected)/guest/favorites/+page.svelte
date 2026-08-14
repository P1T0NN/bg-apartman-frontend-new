<script lang="ts">
	// I18N
	import { m } from '@/paraglide/messages';

	// LIBRARIES
	import { api } from '@/convex/_generated/api';

	// CONFIG
	import { PAGINATION_DATA } from '@/shared/config';

	// CLASSES
	import { favoritesClass } from '@/features/favorites/classes/favoritesClass.svelte';

	// COMPONENTS
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import AccommodationCard from '@/features/accommodations/components/accommodation-card/accommodation-card.svelte';
	import ConvexDataList from '@/components/ui/data-list/convex-data-list.svelte';
	import FavoritesPageLoading from '@/components/pages/(protected)/guest/favorites/loading/favorites-page-loading.svelte';
	import FavoritesPageEmpty from '@/components/pages/(protected)/guest/favorites/empty/favorites-page-empty.svelte';

	// UTILS
	import { formatPlaces } from '@/utils/formatters';

	// TYPES
	import type { Id } from '@/convex/_generated/dataModel';
	import type { SearchAccommodation } from '@/shared/features/accommodation/types/accommodationTypes';

	// The set is filled by the root layout's subscription for signed-in users; this covers the
	// one case that isn't (a device with anonymous hearts landing here before any card mounts).
	// Idempotent + client-only, and a no-op once the server backing is live.
	$effect(() => {
		favoritesClass.hydrate();
	});

	const favoriteIds = $derived([...favoritesClass.ids] as Id<'apartments'>[]);
	const hasSavedIds = $derived(favoriteIds.length > 0);
</script>

<SvelteHead title={m['GuestFavoritesPage.SEO.title']()} description={m['GuestFavoritesPage.SEO.description']()} noIndex />

<section class="flex w-full flex-col gap-6 p-4 md:p-6">
	<header class="flex flex-col gap-1 border-b pb-5">
		<h1 class="text-2xl font-semibold tracking-tight md:text-3xl">{m['GuestFavoritesPage.title']()}</h1>
		<p class="max-w-2xl text-sm leading-relaxed text-muted-foreground">
			{#if hasSavedIds}
				{m['GuestFavoritesPage.savedForLater']({ places: formatPlaces(favoriteIds.length) })}
			{:else}
				{m['GuestFavoritesPage.placesSavedForLater']()}
			{/if}
		</p>
	</header>

	{#if hasSavedIds}
		<ConvexDataList
			query={api.tables.accommodations.queries.fetchFavoriteAccommodationsSafe
				.fetchFavoriteAccommodationsSafe}
			queryArgs={{ ids: favoriteIds }}
			optimizationStrategy="offset"
			pageSize={PAGINATION_DATA.DEFAULT_PAGE_SIZE}
			listClass="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3"
			getItemKey={(item) => (item as SearchAccommodation).id}
		>
			{#snippet item({ item })}
				<AccommodationCard accommodation={item as SearchAccommodation} />
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
