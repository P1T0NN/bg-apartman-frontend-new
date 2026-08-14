<script lang="ts">
	// I18N
	import { m } from '@/paraglide/messages';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/config/routeEndpoints';

	// UTILS
	import { appHref } from '@/utils/app-navigation.js';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// LUCIDE ICONS
	import HeartIcon from '@lucide/svelte/icons/heart';
	import SearchIcon from '@lucide/svelte/icons/search';
</script>

<div
	class="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed px-6 py-16 text-center"
>
	<div class="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
		<HeartIcon class="size-6" aria-hidden="true" />
	</div>

	<div class="flex flex-col gap-1.5">
		<h2 class="text-base font-medium">
			{m['GuestFavoritesPage.FavoritesPageEmpty.noSavedStaysYet']()}
		</h2>
		<p class="mx-auto max-w-sm text-sm text-muted-foreground">
			{m['GuestFavoritesPage.FavoritesPageEmpty.tapTheHeart']()}
		</p>
	</div>

	<Button href={appHref(UNPROTECTED_PAGE_ENDPOINTS.ROOT)} class="mt-1">
		<SearchIcon class="size-4" aria-hidden="true" />
		{m['GuestFavoritesPage.FavoritesPageEmpty.browseStays']()}
	</Button>
</div>
