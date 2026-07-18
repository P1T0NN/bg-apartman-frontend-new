<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';
	import { getLocale } from '@/shared/lib/paraglide/runtime';

	// COMPONENTS
	import AreaChartInteractive from '@/shared/components/ui/custom-charts/area-chart-interactive.svelte';
	import HostDashboardRevenueChartEmpty from '@/shared/components/pages/(protected)/host/dashboard/empty/host-dashboard-revenu-chart-empty.svelte';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type {
		TimeRangeValue,
		TimeRangeOption
	} from '@/shared/components/ui/custom-charts/timerange-data.svelte';
	import type { ChartConfig } from '@/shared/components/ui/chart/chart-utils.js';
	import type { HostSeriesPoint } from '@/convex/pages/host/dashboard/types/hostDashboardTypes';

	let { series }: { series: HostSeriesPoint[] } = $props();

	// Nothing to plot until at least one month has a booking or revenue — show the empty state.
	const hasData = $derived(series.some((p) => p.bookings > 0 || p.revenue > 0));

	let metric = $state<'revenue' | 'bookings'>('revenue');
	let timeRange = $state<TimeRangeValue>('365d');

	const locale = $derived(`${getLocale()}`);
	const data = $derived(
		series.map((p) => ({ date: new Date(p.date), revenue: p.revenue, bookings: p.bookings }))
	);

	const config = $derived<ChartConfig>({
		[metric]: {
			label:
				metric === 'revenue'
					? m['HostDashboardPage.Chart.metricRevenue']()
					: m['HostDashboardPage.Chart.metricBookings'](),
			color: metric === 'revenue' ? 'var(--chart-1)' : 'var(--chart-2)'
		}
	});

	const timeRangeOptions = $derived<TimeRangeOption[]>([
		{ value: '365d', label: m['HostDashboardPage.Chart.range12m'](), days: 365 },
		{ value: '180d', label: m['HostDashboardPage.Chart.range6m'](), days: 180 },
		{ value: '90d', label: m['HostDashboardPage.Chart.range3m'](), days: 90 }
	]);

	const metrics = [
		{ value: 'revenue', label: m['HostDashboardPage.Chart.metricRevenue']() },
		{ value: 'bookings', label: m['HostDashboardPage.Chart.metricBookings']() }
	] as const;
</script>

{#if hasData}
	<div class="flex flex-col gap-3">
		<div class="inline-flex self-start rounded-lg border bg-muted/40 p-0.5">
			{#each metrics as option (option.value)}
				<button
					type="button"
					aria-pressed={metric === option.value}
					onclick={() => (metric = option.value)}
					class={cn(
						'rounded-md px-3 py-1.5 text-sm font-medium transition',
						metric === option.value
							? 'bg-background text-foreground shadow-sm'
							: 'text-muted-foreground hover:text-foreground'
					)}
				>
					{option.label}
				</button>
			{/each}
		</div>

		<AreaChartInteractive
			{data}
			x="date"
			{config}
			{locale}
			bind:timeRange
			{timeRangeOptions}
			snapToMonths
			title={m['HostDashboardPage.Chart.title']()}
			description=""
			showLegend={false}
			xAxisFormat={(v) =>
				v instanceof Date ? v.toLocaleDateString(locale, { month: 'short' }) : String(v)}
			tooltipLabelFormatter={(v) =>
				v instanceof Date
					? v.toLocaleDateString(locale, { month: 'long', year: 'numeric' })
					: String(v)}
		/>
	</div>
{:else}
	<HostDashboardRevenueChartEmpty />
{/if}
