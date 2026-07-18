<script lang="ts">
	// LIBRARIES
	import { localizeHref } from '@/shared/lib/paraglide/runtime';

	// CONFIG
	import { PROTECTED_PAGE_ENDPOINTS } from '@/shared/routeEndpoints';

	// COMPONENTS
	import { Button } from '@/shared/components/ui/button/index.js';
	import { RefreshQueryButton } from '@/shared/components/ui/refresh-query-button/index.js';

	// LUCIDE ICONS
	import AlertTriangleIcon from '@lucide/svelte/icons/triangle-alert';

	let { message }: { message?: string } = $props();
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
		<h2 class="text-lg font-semibold">Couldn't load this accommodation</h2>
		<p class="mx-auto max-w-sm text-sm text-muted-foreground">
			{message ??
				'Something went wrong while loading this accommodation. Please try again in a moment.'}
		</p>
	</div>

	<div class="flex flex-wrap items-center justify-center gap-2">
		<RefreshQueryButton />
		<Button href={localizeHref(PROTECTED_PAGE_ENDPOINTS.MY_ACCOMMODATIONS)} variant="ghost">
			Back to my accommodations
		</Button>
	</div>
</div>
