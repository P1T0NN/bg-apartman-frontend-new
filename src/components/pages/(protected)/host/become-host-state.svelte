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
	import HousePlusIcon from '@lucide/svelte/icons/house-plus';
</script>

<!--
	The whole host area for a visitor with zero listings (HostSystemDesign.md §1): one screen,
	one CTA. No tour, no checklist — the add-listing form IS the onboarding — and nothing
	financial is named here (PaymentsSystemDesign.md §2 stage 0/1).
-->
<div
	class="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed px-6 py-16 text-center"
>
	<div class="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
		<HousePlusIcon class="size-7" aria-hidden="true" />
	</div>

	<div class="flex flex-col gap-1.5">
		<h2 class="text-lg font-semibold">{m['BecomeHostState.title']()}</h2>
		<p class="mx-auto max-w-sm text-sm text-muted-foreground">
			{m['BecomeHostState.subtitle']()}
		</p>
	</div>

	<Button href={appHref(PROTECTED_PAGE_ENDPOINTS.ADD_ACCOMMODATION)} size="lg" class="mt-1">
		{m['BecomeHostState.cta']()}
	</Button>
</div>
