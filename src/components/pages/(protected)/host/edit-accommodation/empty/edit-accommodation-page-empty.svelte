<script lang="ts">
	// I18N
	import { m } from '@/lib/paraglide/messages';

	// CONFIG
	import { PROTECTED_PAGE_ENDPOINTS } from '@/config/routeEndpoints';

	// UTILS
	import { appHref } from '@/utils/app-navigation.js';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

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
		<h2 class="text-lg font-semibold">
			{m['HostEditAccommodationPage.EditAccommodationPageEmpty.notFoundTitle']()}
		</h2>
		<p class="mx-auto max-w-sm text-sm text-muted-foreground">
			{m['HostEditAccommodationPage.EditAccommodationPageEmpty.notFoundDescription']()}
		</p>
	</div>

	<Button href={appHref(PROTECTED_PAGE_ENDPOINTS.MY_ACCOMMODATIONS)} variant="outline">
		<ArrowLeftIcon class="size-4" aria-hidden="true" />
		{m['HostEditAccommodationPage.EditAccommodationPageEmpty.backToMyAccommodations']()}
	</Button>
</div>
