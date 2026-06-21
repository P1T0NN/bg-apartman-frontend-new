<script lang="ts">
	// LIBRARIES
	import { scaleUtc } from 'd3-scale';
	import { BarChart, Highlight } from 'layerchart';
	import { cubicInOut } from 'svelte/easing';

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
	import type { AnyScale } from 'layerchart';
	import type { ChartConfig } from '@/shared/components/ui/chart/chart-utils.js';
	import type { ChartDatum, InteractiveChartSeries } from './types/chartTypes';

	type LayerBarChartProps = {
		bars?: Record<string, unknown>;
		highlight?: Record<string, unknown>;
		xAxis?: Record<string, unknown>;
		yAxis?: Record<string, unknown>;
		[key: string]: unknown;
	};

	function defaultXAxisTicks(scale: AnyScale) {
		return scaleUtc(scale.domain() as [Date, Date], scale.range() as [number, number]).ticks();
	}

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
		xAxisTicks,
		yAxisFormat,
		valueFormatter,
		tooltipLabelFormatter,
		tooltipNameKey = 'views',
		showHighlight = true,
		title = 'Bar Chart - Interactive',
		description = 'Showing total visitors for the last 3 months',
		cardClass,
		cardHeaderClass = 'flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row',
		cardHeaderContentClass = 'flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6',
		cardContentClass = 'px-2 sm:p-6',
		containerClass = 'aspect-auto h-62.5 w-full',
		controlsClass = 'flex',
		controlClass = 'relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-start even:border-s data-[active=true]:bg-muted/50 sm:border-s sm:border-t-0 sm:px-8 sm:py-6',
		barChartProps,
		belowMarks: userBelowMarks,
		tooltip: userTooltip
	}: {
		data: ChartDatum[];
		x: string;
		config: ChartConfig;
		activeChart?: string;
		seriesKeys?: string[];
		axis?: 'x' | 'y' | false;
		y?: string;
		locale?: string;
		xAxisFormat?: (value: unknown) => string;
		xAxisTicks?: (scale: AnyScale) => Date[];
		yAxisFormat?: (value: unknown) => string;
		valueFormatter?: (value: number, key: string) => string;
		tooltipLabelFormatter?: (value: unknown) => string;
		tooltipNameKey?: string;
		showHighlight?: boolean;
		title?: string;
		description?: string;
		cardClass?: string;
		cardHeaderClass?: string;
		cardHeaderContentClass?: string;
		cardContentClass?: string;
		containerClass?: string;
		controlsClass?: string;
		controlClass?: string;
		barChartProps?: LayerBarChartProps;
		belowMarks?: Snippet;
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
					day: '2-digit'
				}))
	);
	const resolvedTooltipLabelFormatter = $derived(
		tooltipLabelFormatter ??
			((value: unknown) =>
				formatDateValue(value, locale, {
					month: 'short',
					day: 'numeric',
					year: 'numeric'
				}))
	);
	const resolvedBarsProps = $derived({
		stroke: 'none',
		rounded: 'none' as const,
		motion: { type: 'tween' as const, duration: 500, easing: cubicInOut },
		...barChartProps?.bars
	});
	const resolvedHighlightProps = $derived({
		area: { fill: 'none' },
		...barChartProps?.highlight
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
			<BarChart
				{data}
				{x}
				{y}
				{axis}
				series={activeSeries}
				props={{
					...barChartProps,
					bars: resolvedBarsProps,
					highlight: resolvedHighlightProps,
					xAxis: {
						format: resolvedXAxisFormat,
						ticks: xAxisTicks ?? defaultXAxisTicks,
						...barChartProps?.xAxis
					},
					yAxis: {
						format: yAxisFormat,
						...barChartProps?.yAxis
					}
				}}
			>
				{#snippet belowMarks()}
					{#if userBelowMarks}
						{@render userBelowMarks()}
					{:else if showHighlight}
						<Highlight area={{ class: 'fill-muted' }} />
					{/if}
				{/snippet}
				{#snippet tooltip()}
					{#if userTooltip}
						{@render userTooltip()}
					{:else}
						<Chart.Tooltip
							nameKey={tooltipNameKey}
							labelFormatter={resolvedTooltipLabelFormatter}
						/>
					{/if}
				{/snippet}
			</BarChart>
		</Chart.Container>
	</Card.Content>
</Card.Root>
