<script lang="ts">
	// COMPONENTS
	import { RefreshQueryButton } from '@/shared/components/ui/refresh-query-button/index.js';

	// LUCIDE ICONS
	import AlertTriangleIcon from '@lucide/svelte/icons/triangle-alert';
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
		<h3 class="text-lg font-semibold">Couldn't load featured stays</h3>
		<p class="mx-auto max-w-sm text-sm text-muted-foreground">
			Something went wrong while loading these. Please try again in a moment.
		</p>
	</div>

	<RefreshQueryButton />
</div>
