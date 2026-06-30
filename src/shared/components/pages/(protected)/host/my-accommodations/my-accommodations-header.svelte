<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';
	import { localizeHref } from '@/shared/lib/paraglide/runtime';

	// CONFIG
	import { PROTECTED_PAGE_ENDPOINTS } from '@/shared/routeEndpoints';

	// COMPONENTS
	import { Button } from '@/shared/components/ui/button/index.js';

	// LUCIDE ICONS
	import PlusIcon from '@lucide/svelte/icons/plus';
</script>

<header class="flex flex-col gap-4 border-b pb-5 md:flex-row md:items-end md:justify-between">
	<div class="max-w-2xl space-y-2">
		<div class="space-y-1">
			<h1 class="text-2xl font-semibold tracking-tight md:text-3xl">
				{m['MyAccommodationsPage.MyAccommodationsHeader.title']()}
			</h1>

			<p class="text-sm leading-relaxed text-muted-foreground">
				{m['MyAccommodationsPage.MyAccommodationsHeader.description']()}
			</p>
		</div>
	</div>

	<Button href={localizeHref(PROTECTED_PAGE_ENDPOINTS.ADD_ACCOMMODATION)} class="w-full md:w-auto">
		<PlusIcon class="size-4" aria-hidden="true" />
		{m['MyAccommodationsPage.MyAccommodationsHeader.addAccommodation']()}
	</Button>
</header>
