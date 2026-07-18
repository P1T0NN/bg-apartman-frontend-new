<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';

	// COMPONENTS
	import { RefreshQueryButton } from '@/shared/components/ui/refresh-query-button/index.js';

	// LUCIDE ICONS
	import AlertTriangleIcon from '@lucide/svelte/icons/triangle-alert';
</script>

<div
	class="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-destructive/30 bg-destructive/5 px-6 py-16 text-center"
	role="alert"
>
	<div
		class="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive"
	>
		<AlertTriangleIcon class="size-7" aria-hidden="true" />
	</div>

	<div class="flex flex-col gap-1.5">
		<h2 class="text-lg font-semibold">
			{m['HostReservationsPage.HostReservationsPageError.title']()}
		</h2>
		<p class="mx-auto max-w-sm text-sm text-muted-foreground">
			{m['HostReservationsPage.HostReservationsPageError.description']()}
		</p>
	</div>

	<RefreshQueryButton
		variant="outline"
		size="sm"
		label={m['HostReservationsPage.HostReservationsPageError.retry']()}
	/>
</div>
