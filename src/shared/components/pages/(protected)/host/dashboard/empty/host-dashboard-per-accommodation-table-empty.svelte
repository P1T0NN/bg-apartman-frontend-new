<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';
	import { localizeHref } from '@/shared/lib/paraglide/runtime';

	// CONFIG
	import { PROTECTED_PAGE_ENDPOINTS } from '@/shared/routeEndpoints';

	// COMPONENTS
	import { Button } from '@/shared/components/ui/button/index.js';

	// LUCIDE ICONS
	import LayoutGridIcon from '@lucide/svelte/icons/layout-grid';
</script>

<div
	class="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed px-6 py-12 text-center"
>
	<div class="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
		<LayoutGridIcon class="size-7" aria-hidden="true" />
	</div>

	<div class="flex flex-col gap-1.5">
		<h2 class="text-base font-semibold tracking-tight">
			{m['HostDashboardPage.PerAccommodationEmpty.heading']()}
		</h2>
		<p class="mx-auto max-w-sm text-sm text-muted-foreground">
			{m['HostDashboardPage.PerAccommodationEmpty.body']()}
		</p>
	</div>

	<Button
		href={localizeHref(PROTECTED_PAGE_ENDPOINTS.ADD_ACCOMMODATION)}
		variant="outline"
		size="sm"
		class="mt-1"
	>
		{m['HostDashboardPage.PerAccommodationEmpty.cta']()}
	</Button>
</div>
