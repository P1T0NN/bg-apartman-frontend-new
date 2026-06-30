<script lang="ts">
	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/routeEndpoints';

	// COMPONENTS
	import { Button } from '@/shared/components/ui/button/index.js';
	import { RefreshQueryButton } from '@/shared/components/ui/refresh-query-button/index.js';

	// LUCIDE ICONS
	import AlertTriangleIcon from '@lucide/svelte/icons/triangle-alert';
	import SearchIcon from '@lucide/svelte/icons/search';
</script>

<div class="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
	<div
		class="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-destructive/30 bg-destructive/5 px-6 py-16 text-center"
	>
		<div
			class="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive"
		>
			<AlertTriangleIcon class="size-7" aria-hidden="true" />
		</div>

		<div class="flex flex-col gap-1.5">
			<h1 class="text-lg font-semibold">Couldn't load this listing</h1>
			<p class="mx-auto max-w-sm text-sm text-muted-foreground">
				Something went wrong while loading this listing. Please try again in a moment.
			</p>
		</div>

		<div class="flex flex-wrap items-center justify-center gap-2">
			<RefreshQueryButton />

			<Button href={UNPROTECTED_PAGE_ENDPOINTS.ROOT} variant="outline">
				<SearchIcon class="size-4" aria-hidden="true" />
				Browse stays
			</Button>
		</div>
	</div>
</div>
