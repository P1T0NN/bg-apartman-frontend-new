<script lang="ts">
	// I18N
	import { m } from '@/paraglide/messages';

	// UTILS
	import { appHref } from '@/utils/app-navigation.js';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// LUCIDE ICONS
	import SearchXIcon from '@lucide/svelte/icons/search-x';
	import SearchIcon from '@lucide/svelte/icons/search';
</script>

<div
	class="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed px-6 py-16 text-center"
>
	<div class="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
		<SearchXIcon class="size-7" aria-hidden="true" />
	</div>

	<div class="flex flex-col gap-1.5">
		<h1 class="text-lg font-semibold">
			{m['ReservationPage.ReservationPageEmpty.reservationNotFound']()}
		</h1>
		<p class="mx-auto max-w-sm text-sm text-muted-foreground">
			{m['ReservationPage.ReservationPageEmpty.invalidLink']()}
		</p>
	</div>

	<Button href={appHref('/search')} variant="outline">
		<SearchIcon class="size-4" aria-hidden="true" />
		{m['ReservationPage.ReservationPageEmpty.browseStays']()}
	</Button>
</div>
