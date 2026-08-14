<script lang="ts">
	// I18N
	import { m } from '@/paraglide/messages';

	// CONFIG
	import { PROTECTED_PAGE_ENDPOINTS } from '@/config/routeEndpoints';

	// UTILS
	import { appHref } from '@/utils/app-navigation.js';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// LUCIDE ICONS
	import PlusIcon from '@lucide/svelte/icons/plus';
</script>

<header class="flex flex-col gap-4 border-b pb-5 md:flex-row md:items-end md:justify-between">
	<div class="max-w-2xl space-y-2">
		<div class="space-y-1">
			<h1 class="text-2xl font-semibold tracking-tight md:text-3xl">
				{m['HostMyAccommodationsPage.MyAccommodationsHeader.title']()}
			</h1>

			<p class="text-sm leading-relaxed text-muted-foreground">
				{m['HostMyAccommodationsPage.MyAccommodationsHeader.description']()}
			</p>
		</div>
	</div>

	<Button href={appHref(PROTECTED_PAGE_ENDPOINTS.ADD_ACCOMMODATION)} class="w-full md:w-auto">
		<PlusIcon class="size-4" aria-hidden="true" />
		{m['HostMyAccommodationsPage.MyAccommodationsHeader.addAccommodation']()}
	</Button>
</header>
