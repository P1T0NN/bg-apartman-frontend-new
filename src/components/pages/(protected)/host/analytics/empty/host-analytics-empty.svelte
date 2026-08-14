<script lang="ts">
	// I18N
	import { m } from '@/paraglide/messages';

	// LUCIDE ICONS
	import ChartColumnIcon from '@lucide/svelte/icons/chart-column';
</script>

<div
	class="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed px-6 py-16 text-center"
>
	<div class="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
		<ChartColumnIcon class="size-7" aria-hidden="true" />
	</div>

	<div class="flex flex-col gap-1.5">
		<h2 class="text-base font-semibold tracking-tight">{m['HostAnalyticsPage.HostAnalyticsEmpty.emptyTitle']()}</h2>

		<p class="mx-auto max-w-sm text-sm text-muted-foreground">
			{m['HostAnalyticsPage.HostAnalyticsEmpty.emptyDescription']()}
		</p>
	</div>
</div>
