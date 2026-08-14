<script lang="ts">
	// I18N
	import { m } from '@/paraglide/messages';

	// CONFIG
	import { ADMIN_PAGE_ENDPOINTS } from '@/config/routeEndpoints';

	// UTILS
	import { appHref } from '@/utils/app-navigation.js';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// LUCIDE ICONS
	import PlusIcon from '@lucide/svelte/icons/plus';
</script>

<header class="flex items-start justify-between gap-4">
	<div class="flex flex-col gap-1">
		<h1 class="text-2xl font-semibold tracking-tight">
			{m['AdminAccommodationsPage.AdminAccommodationsHeader.title']()}
		</h1>
		<p class="text-sm text-muted-foreground">
			{m['AdminAccommodationsPage.AdminAccommodationsHeader.subtitle']()}
		</p>
	</div>

	<Button href={appHref(ADMIN_PAGE_ENDPOINTS.ADD_ACCOMMODATION)}>
		<PlusIcon class="size-4" />
		{m['AdminAccommodationsPage.AdminAccommodationsHeader.addAccommodation']()}
	</Button>
</header>
