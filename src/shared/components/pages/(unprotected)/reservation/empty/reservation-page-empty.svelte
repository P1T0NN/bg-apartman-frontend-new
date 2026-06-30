<script lang="ts">
	// LIBRARIES
	import { localizeHref } from '@/shared/lib/paraglide/runtime';
	import { m } from '@/shared/lib/paraglide/messages';

	// COMPONENTS
	import { Button } from '@/shared/components/ui/button/index.js';

	// LUCIDE ICONS
	import SearchXIcon from '@lucide/svelte/icons/search-x';
	import SearchIcon from '@lucide/svelte/icons/search';
</script>

<div
	class="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed px-6 py-16 text-center"
>
	<div
		class="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground"
	>
		<SearchXIcon class="size-7" aria-hidden="true" />
	</div>

	<div class="flex flex-col gap-1.5">
		<h1 class="text-lg font-semibold">{m['ReservationPage.ReservationPageEmpty.title']()}</h1>
		<p class="mx-auto max-w-sm text-sm text-muted-foreground">
			{m['ReservationPage.ReservationPageEmpty.description']()}
		</p>
	</div>

	<Button href={localizeHref('/search')} variant="outline">
		<SearchIcon class="size-4" aria-hidden="true" />
		{m['ReservationPage.ReservationPageEmpty.browseStays']()}
	</Button>
</div>
