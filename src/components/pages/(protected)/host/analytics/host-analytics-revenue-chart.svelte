<script lang="ts">
	// COMPONENTS
	import AreaChartInteractive from '@/components/ui/custom-charts/area-chart-interactive.svelte';

	// UTILS
	import { formatCurrency } from '@/utils/formatters';
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { ChartConfig } from '@/components/ui/chart/chart-utils.js';
	import type { HostSeriesPoint } from '@/convex/pages/host/analytics/types/hostAnalyticsTypes';

	/**
	 * The host's revenue/bookings trend (HostSystemDesign.md §2b). Purely presentational:
	 * the page owns the period (top-right picker) and the fetch — this receives an
	 * already-windowed series plus the server's bucket size, and only picks axis formats.
	 *
	 * The value axis is labelled (not hover-only): the question this page answers is "how's
	 * business", and that shouldn't require pointing at the chart to read a number.
	 */
	let { series, bucketUnit }: { series: HostSeriesPoint[]; bucketUnit: 'day' | 'month' } = $props();

	let metric = $state<'revenue' | 'bookings'>('revenue');

	const locale = 'en';
	const data = $derived(
		series.map((p) => ({ date: new Date(p.date), revenue: p.revenue, bookings: p.bookings }))
	);

	const config = $derived<ChartConfig>({
		[metric]: {
			label: metric === 'revenue' ? 'Revenue' : 'Bookings',
			color: metric === 'revenue' ? 'var(--chart-1)' : 'var(--chart-2)'
		}
	});

	// The headline for the visible window — the number a host wants before reading any shape.
	const total = $derived(
		series.reduce((sum, p) => sum + (metric === 'revenue' ? p.revenue : p.bookings), 0)
	);
	const totalLabel = $derived(metric === 'revenue' ? formatCurrency(total) : `${total}`);

	// Axis/tooltip granularity follows the server's bucket choice.
	const xAxisOptions = $derived<Intl.DateTimeFormatOptions>(
		bucketUnit === 'day' ? { month: 'short', day: 'numeric' } : { month: 'short' }
	);
	const tooltipOptions = $derived<Intl.DateTimeFormatOptions>(
		bucketUnit === 'day'
			? { weekday: 'short', month: 'long', day: 'numeric', timeZone: 'UTC' }
			: { month: 'long', year: 'numeric', timeZone: 'UTC' }
	);

	// Ticks are clean rounded numbers, compacted past a thousand so the gutter stays narrow:
	// "€0 / €1.2K / €2.4K", "0 / 5 / 10".
	const compact = new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 });

	function formatYTick(value: unknown): string {
		if (typeof value !== 'number' || !Number.isFinite(value)) return '';
		// Bookings are a count — d3 happily offers 0.5 ticks on small domains; skip them.
		if (metric === 'bookings' && !Number.isInteger(value)) return '';
		const n = compact.format(value);
		return metric === 'revenue' ? `€${n}` : n;
	}

	const metrics = [
		{ value: 'revenue', label: 'Revenue' },
		{ value: 'bookings', label: 'Bookings' }
	] as const;
</script>

<div class="flex flex-col gap-3">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div class="inline-flex rounded-lg border bg-muted/40 p-0.5">
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

		<!-- Total for the selected window. Proportional figures: a standalone number reads
		     loose in tabular-nums at this size. -->
		<div class="flex items-baseline gap-2">
			<span class="text-xs text-muted-foreground">
				{metric === 'revenue' ? 'Total revenue' : 'Total bookings'}
			</span>
			<span class="text-lg font-semibold">{totalLabel}</span>
		</div>
	</div>

	<AreaChartInteractive
		{data}
		x="date"
		{config}
		{locale}
		timeRange="custom"
		showTimeRange={false}
		axis={true}
		title="Revenue & bookings"
		description=""
		showLegend={false}
		containerClass="-ml-1 aspect-auto h-72 w-full"
		fillOpacity={0.3}
		gradientStartOpacity={0.9}
		gradientEndOpacity={0.02}
		areaChartProps={{
			// 2px round-capped line over a soft wash — the mark carries the weight, the fill hints.
			area: { line: { class: 'stroke-2 [stroke-linecap:round] [stroke-linejoin:round]' } },
			// Few, clean ticks; the gridlines they anchor do the reading work.
			yAxis: { ticks: 4 }
		}}
		yAxisFormat={formatYTick}
		xAxisFormat={(v) => (v instanceof Date ? v.toLocaleDateString(locale, xAxisOptions) : String(v))}
		tooltipLabelFormatter={(v) =>
			v instanceof Date ? v.toLocaleDateString(locale, tooltipOptions) : String(v)}
	/>
</div>
