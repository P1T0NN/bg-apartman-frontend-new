<script lang="ts">
	// COMPONENTS
	import HostAnalyticsPeriodPicker, {
		type AnalyticsWindow
	} from '@/components/pages/(protected)/host/analytics/host-analytics-period-picker.svelte';

	let { analyticsWindow = $bindable() }: { analyticsWindow: AnalyticsWindow } = $props();
</script>

<header class="flex flex-wrap items-start justify-between gap-4">
	<div class="flex flex-col gap-1">
		<h1 class="text-2xl font-semibold tracking-tight">Analytics</h1>
		<p class="text-sm text-muted-foreground">
			How your accommodations are performing — trend and per-listing.
		</p>
	</div>

	<HostAnalyticsPeriodPicker bind:analyticsWindow />
</header>
