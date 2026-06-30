<script lang="ts">
	// LIBRARIES
	import { localizeHref } from '@/shared/lib/paraglide/runtime';
	import { m } from '@/shared/lib/paraglide/messages';

	// COMPONENTS
	import { Button } from '@/shared/components/ui/button/index.js';
	import { RefreshQueryButton } from '@/shared/components/ui/refresh-query-button/index.js';

	// LUCIDE ICONS
	import AlertTriangleIcon from '@lucide/svelte/icons/triangle-alert';
	import SearchIcon from '@lucide/svelte/icons/search';
</script>

<div
	class="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-destructive/30 bg-destructive/5 px-6 py-16 text-center"
>
	<div
		class="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive"
	>
		<AlertTriangleIcon class="size-7" aria-hidden="true" />
	</div>

	<div class="flex flex-col gap-1.5">
		<h1 class="text-lg font-semibold">{m['ReservationPage.ReservationPageError.title']()}</h1>
		<p class="mx-auto max-w-sm text-sm text-muted-foreground">
			{m['ReservationPage.ReservationPageError.description']()}
		</p>
	</div>

	<div class="flex flex-wrap items-center justify-center gap-2">
		<RefreshQueryButton />

		<Button href={localizeHref('/search')} variant="outline">
			<SearchIcon class="size-4" aria-hidden="true" />
			{m['ReservationPage.ReservationPageError.browseStays']()}
		</Button>
	</div>
</div>
