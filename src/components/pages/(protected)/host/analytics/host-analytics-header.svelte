<script lang="ts">
	// I18N
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import HostAnalyticsPeriodPicker, {
		type AnalyticsWindow
	} from '@/components/pages/(protected)/host/analytics/host-analytics-period-picker.svelte';

	let { analyticsWindow = $bindable() }: { analyticsWindow: AnalyticsWindow } = $props();
</script>

<header class="flex flex-wrap items-start justify-between gap-4">
	<div class="flex flex-col gap-1">
		<h1 class="text-2xl font-semibold tracking-tight">{m['HostAnalyticsPage.HostAnalyticsHeader.title']()}</h1>
		<p class="text-sm text-muted-foreground">
			{m['HostAnalyticsPage.HostAnalyticsHeader.description']()}
		</p>
	</div>

	<HostAnalyticsPeriodPicker bind:analyticsWindow />
</header>
