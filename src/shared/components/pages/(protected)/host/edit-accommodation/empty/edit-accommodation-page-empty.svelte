<script lang="ts">
	// LIBRARIES
	import { localizeHref } from '@/shared/lib/paraglide/runtime';

	// CONFIG
	import { PROTECTED_PAGE_ENDPOINTS } from '@/shared/routeEndpoints';

	// COMPONENTS
	import { Button } from '@/shared/components/ui/button/index.js';

	// LUCIDE ICONS
	import HouseIcon from '@lucide/svelte/icons/house';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
</script>

<div
	class="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed px-6 py-16 text-center"
>
	<div class="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
		<HouseIcon class="size-7" aria-hidden="true" />
	</div>

	<div class="flex flex-col gap-1.5">
		<h2 class="text-lg font-semibold">Accommodation not found</h2>
		<p class="mx-auto max-w-sm text-sm text-muted-foreground">
			This accommodation may have been removed, or it isn't one of yours. Head back to your
			accommodations to keep editing.
		</p>
	</div>

	<Button href={localizeHref(PROTECTED_PAGE_ENDPOINTS.MY_ACCOMMODATIONS)} variant="outline">
		<ArrowLeftIcon class="size-4" aria-hidden="true" />
		Back to my accommodations
	</Button>
</div>
