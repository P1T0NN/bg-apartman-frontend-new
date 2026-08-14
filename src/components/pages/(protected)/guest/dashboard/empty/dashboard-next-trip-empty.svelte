<script lang="ts">
	// I18N
	import { m } from '@/paraglide/messages';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/config/routeEndpoints.js';

	// UTILS
	import { appHref } from '@/utils/app-navigation.js';
	// COMPONENTS
	import * as Card from '@/components/ui/card/index.js';
	import { Button } from '@/components/ui/button/index.js';

	// LUCIDE ICONS
	import CompassIcon from '@lucide/svelte/icons/compass';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
</script>

<Card.Root class="flex flex-col items-center gap-3 p-10 text-center">
	<div class="grid size-12 place-items-center rounded-full bg-muted">
		<CompassIcon class="size-6 text-muted-foreground" aria-hidden="true" />
	</div>

	<div class="space-y-1">
		<h2 class="text-lg font-semibold">
			{m['GuestDashboardPage.DashboardNextTripEmpty.noTripsYet']()}
		</h2>
		<p class="text-sm text-muted-foreground">
			{m['GuestDashboardPage.DashboardNextTripEmpty.whenYouBook']()}
		</p>
	</div>

	<Button href={appHref(UNPROTECTED_PAGE_ENDPOINTS.ROOT)} class="mt-2">
		{m['GuestDashboardPage.DashboardNextTripEmpty.browseStays']()}
		<ArrowRightIcon class="size-4" aria-hidden="true" />
	</Button>
</Card.Root>
