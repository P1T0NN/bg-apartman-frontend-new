<script lang="ts">
	// LIBRARIES
	import { scaleUtc } from 'd3-scale';
	import { curveMonotoneX } from 'd3-shape';
	import { LineChart } from 'layerchart';

	// COMPONENTS
	import * as Card from '@/shared/components/ui/card/index.js';
	import * as Chart from '@/shared/components/ui/chart/index.js';

	// UTILS
	import {
		formatDateValue,
		getInteractiveSeries,
		getInteractiveSeriesKeys,
		getNumericSeriesTotals
	} from './utils/interactiveChartUtils';

	// TYPES
	import type { Snippet } from 'svelte';
	import type { ChartConfig } from '@/shared/components/ui/chart/chart-utils.js';
	import type { ChartDatum, InteractiveChartSeries } from './types/chartTypes';

	type LayerLineChartProps = {
		spline?: Record<string, unknown>;
		highlight?: Record<string, unknown>;
		xAxis?: Record<string, unknown>;
		yAxis?: Record<string, unknown>;
		[key: string]: unknown;
	};

	let {
		data,
		x,
		config,
		activeChart = $bindable<string | undefined>(),
		seriesKeys,
		axis = 'x',
		y,
		locale = 'en-US',
		xAxisFormat,
		yAxisFormat,
		valueFormatter,
		tooltipHideLabel = true,
		tooltipIndicator,
		tooltipLabelFormatter,
		title = 'Line Chart - Interactive',
		description = 'Showing total visitors for the last 3 months',
		cardClass,
		cardHeaderClass = 'flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row',
		cardHeaderContentClass = 'flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6',
		cardContentClass = 'px-2 sm:p-6',
		containerClass = 'aspect-auto h-[250px] w-full',
		controlsClass = 'flex',
		controlClass = 'relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-start even:border-s data-[active=true]:bg-muted/50 sm:border-s sm:border-t-0 sm:px-8 sm:py-6',
		lineChartProps,
		tooltip: userTooltip
	}: {
		data: ChartDatum[];
		x: string;
		config: ChartConfig;
		activeChart?: string;
		seriesKeys?: string[];
		axis?: 'x' | false;
		y?: string;
		locale?: string;
		xAxisFormat?: (value: unknown) => string;
		yAxisFormat?: (value: unknown) => string;
		valueFormatter?: (value: number, key: string) => string;
		tooltipHideLabel?: boolean;
		tooltipIndicator?: 'dot' | 'line' | 'dashed';
		tooltipLabelFormatter?: (value: unknown, payload: unknown[]) => string | number;
		title?: string;
		description?: string;
		cardClass?: string;
		cardHeaderClass?: string;
		cardHeaderContentClass?: string;
		cardContentClass?: string;
		containerClass?: string;
		controlsClass?: string;
		controlClass?: string;
		lineChartProps?: LayerLineChartProps;
		tooltip?: Snippet;
	} = $props();

	const resolvedSeriesKeys = $derived(seriesKeys ?? getInteractiveSeriesKeys(data, config, [x]));
	const seriesOptions = $derived(getInteractiveSeries(config, resolvedSeriesKeys));
	const selectedSeries = $derived(
		seriesOptions.find((series) => series.key === activeChart) ?? seriesOptions[0]
	);
	const activeSeries = $derived(
		selectedSeries ? ([selectedSeries] satisfies InteractiveChartSeries[]) : []
	);
	const totals = $derived(getNumericSeriesTotals(data, resolvedSeriesKeys));
	const resolvedValueFormatter = $derived(
		valueFormatter ?? ((value: number) => value.toLocaleString(locale))
	);
	const resolvedXAxisFormat = $derived(
		xAxisFormat ??
			((value: unknown) =>
				formatDateValue(value, locale, {
					month: 'short',
					day: 'numeric'
				}))
	);
	const resolvedSplineProps = $derived({
		curve: curveMonotoneX,
		motion: 'tween' as const,
		strokeWidth: 2,
		...lineChartProps?.spline
	});
	const resolvedHighlightProps = $derived({
		points: { r: 4 },
		...lineChartProps?.highlight
	});
</script>

<Card.Root class={cardClass}>
	<Card.Header class={cardHeaderClass}>
		<div class={cardHeaderContentClass}>
			{#if title}
				<Card.Title>{title}</Card.Title>
			{/if}
			{#if description}
				<Card.Description>{description}</Card.Description>
			{/if}
		</div>
		<div class={controlsClass}>
			{#each seriesOptions as option (option.key)}
				{@const isActive = selectedSeries?.key === option.key}
				<button
					type="button"
					data-active={isActive}
					aria-pressed={isActive}
					class={controlClass}
					onclick={() => (activeChart = option.key)}
				>
					<span class="text-xs text-muted-foreground">
						{option.label}
					</span>
					<span class="text-lg leading-none font-bold sm:text-3xl">
						{resolvedValueFormatter(totals[option.key] ?? 0, option.key)}
					</span>
				</button>
			{/each}
		</div>
	</Card.Header>
	<Card.Content class={cardContentClass}>
		<Chart.Container {config} class={containerClass}>
			<LineChart
				{data}
				{x}
				{y}
				xScale={scaleUtc()}
				{axis}
				series={activeSeries}
				props={{
					...lineChartProps,
					spline: resolvedSplineProps,
					xAxis: {
						format: resolvedXAxisFormat,
						...lineChartProps?.xAxis
					},
					yAxis: {
						format: yAxisFormat,
						...lineChartProps?.yAxis
					},
					highlight: resolvedHighlightProps
				}}
			>
				{#snippet tooltip()}
					{#if userTooltip}
						{@render userTooltip()}
					{:else}
						<Chart.Tooltip
							hideLabel={tooltipHideLabel}
							indicator={tooltipIndicator}
							labelFormatter={tooltipLabelFormatter}
						/>
					{/if}
				{/snippet}
			</LineChart>
		</Chart.Container>
	</Card.Content>
</Card.Root>
