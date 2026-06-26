<script lang="ts">
	import Section from '@/shared/components/ui/section/section.svelte';
	import AreaChartInteractive from '@/shared/components/ui/custom-charts/area-chart-interactive.svelte';
	import BarChartInteractive from '@/shared/components/ui/custom-charts/bar-chart-interactive.svelte';
	import LineChartInteractive from '@/shared/components/ui/custom-charts/line-chart-interactive.svelte';
	import {
		visitorTimeSeriesBarChartConfig,
		visitorTimeSeriesChartConfig,
		visitorTimeSeriesData
	} from './demo-chart-data';
</script>

<Section yPadding="md" containerClass="flex w-full flex-col gap-8">
	<AreaChartInteractive
		data={visitorTimeSeriesData}
		x="date"
		config={visitorTimeSeriesChartConfig}
	/>

	<BarChartInteractive
		data={visitorTimeSeriesData}
		x="date"
		config={visitorTimeSeriesBarChartConfig}
	/>

	<LineChartInteractive
		data={visitorTimeSeriesData}
		x="date"
		config={visitorTimeSeriesChartConfig}
	/>
</Section>
