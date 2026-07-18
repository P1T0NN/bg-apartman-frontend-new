<script lang="ts">
	// LIBRARIES
	import { localizeHref } from '@/shared/lib/paraglide/runtime';

	// COMPONENTS
	import { Button } from '@/shared/components/ui/button/index.js';

	// LUCIDE ICONS
	import HouseIcon from '@lucide/svelte/icons/house';
	import SearchIcon from '@lucide/svelte/icons/search';
</script>

<!-- Fill the viewport below the sticky h-14 header so the footer stays below the fold
     (only revealed on scroll) instead of sitting right under this short empty card. -->
<div
	class="mx-auto flex min-h-[calc(100dvh-3.5rem)] w-full max-w-7xl items-center justify-center px-4 py-16 sm:px-6 lg:px-8"
>
	<div
		class="flex w-full max-w-xl flex-col items-center justify-center gap-4 rounded-xl border border-dashed px-6 py-16 text-center"
	>
		<div
			class="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground"
		>
			<HouseIcon class="size-7" aria-hidden="true" />
		</div>

		<div class="flex flex-col gap-1.5">
			<h1 class="text-lg font-semibold">Accommodation unavailable</h1>
			<p class="mx-auto max-w-sm text-sm text-muted-foreground">
				This stay may have been removed or is no longer published. Browse our other places to stay.
			</p>
		</div>

		<Button href={localizeHref('/search')} variant="outline">
			<SearchIcon class="size-4" aria-hidden="true" />
			Browse stays
		</Button>
	</div>
</div>
