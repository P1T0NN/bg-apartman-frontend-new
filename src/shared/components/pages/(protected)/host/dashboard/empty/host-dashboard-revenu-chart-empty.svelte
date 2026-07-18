<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';

	// LUCIDE ICONS
	import ChartAreaIcon from '@lucide/svelte/icons/chart-area';
</script>

<div
	class="flex min-h-64 flex-col items-center justify-center gap-4 rounded-xl border border-dashed px-6 py-12 text-center"
>
	<div class="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
		<ChartAreaIcon class="size-7" aria-hidden="true" />
	</div>

	<div class="flex flex-col gap-1.5">
		<h2 class="text-base font-semibold tracking-tight">
			{m['HostDashboardPage.ChartEmpty.heading']()}
		</h2>
		<p class="mx-auto max-w-sm text-sm text-muted-foreground">
			{m['HostDashboardPage.ChartEmpty.body']()}
		</p>
	</div>
</div>
