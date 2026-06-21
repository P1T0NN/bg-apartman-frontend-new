<script lang="ts">
    // LIBRARIES
	import { LineChart, Points } from 'layerchart';
	import { scaleUtc, scaleBand } from 'd3-scale';
	import { curveLinear, curveMonotoneX, curveNatural, curveStep } from 'd3-shape';

	// COMPONENTS
	import * as Card from '@/shared/components/ui/card/index.js';
	import * as Chart from '@/shared/components/ui/chart/index.js';

	// UTILS
	import { defaultXAxisFormat } from '../utils/chartUtils';

	// TYPES
	import type { Snippet, Component, ComponentProps } from 'svelte';
	import type { ChartConfig } from '@/shared/components/ui/chart/chart-utils.js';

	// LUCIDE ICONS
	import TrendingUpIcon from '@lucide/svelte/icons/trending-up';

	// ─── Curve map ───────────────────────────────────────────────────────────────

	const CURVES = {
		monotone: curveMonotoneX,
		natural: curveNatural,
		linear: curveLinear,
		step: curveStep
	} as const;

	type CurveType = keyof typeof CURVES;

	// ─── Presets ─────────────────────────────────────────────────────────────────

	type LinePreset = 'default' | 'linear' | 'step' | 'dots';
	type LayerPointProps = Partial<ComponentProps<typeof Points>>;
	type LayerLineChartProps = {
		points?: LayerPointProps;
		[key: string]: unknown;
	};
	type LineSeries = {
		key: string;
		props?: LayerPointProps;
	};
	type LineChartSnippetParams = {
		context: {
			series: {
				visibleSeries: LineSeries[];
			};
		};
	};

	interface PresetConfig {
		curve: CurveType;
		showPoints: boolean;
		pointRadius: number;
		highlightPointRadius: number;
	}

	const PRESETS: Record<LinePreset, PresetConfig> = {
		default: {
			curve: 'monotone',
			showPoints: false,
			pointRadius: 0,
			highlightPointRadius: 4
		},
		linear: {
			curve: 'linear',
			showPoints: false,
			pointRadius: 0,
			highlightPointRadius: 4
		},
		step: {
			curve: 'step',
			showPoints: false,
			pointRadius: 0,
			highlightPointRadius: 4
		},
		dots: {
			curve: 'monotone',
			showPoints: true,
			pointRadius: 4,
			highlightPointRadius: 6
		}
	};

	// ─── Props ───────────────────────────────────────────────────────────────────

	let {
		data,
		x,
		y,
		config,
		// Preset + overrides
		preset = 'default' as LinePreset,
		curve: curveOverride,
		showPoints: showPointsOverride,
		pointRadius: pointRadiusOverride,
		highlightPointRadius: highlightPointRadiusOverride,
		// Scale & axis
		xScaleType = 'time',
		axis = 'x' as 'x' | false,
		xAxisFormat,
		colorFn,
		yPadding,
		// Labels
		labels,
		// Tooltip
		tooltipHideLabel = true,
		tooltipIndicator,
		tooltipLabelFormatter,
		// Card
		title,
		description,
		cardClass,
		cardContentClass,
		containerClass,
		// Footer
		footerTrend,
		footerTrendIcon,
		footerDateRange,
		// Extra props
		lineChartProps,
		// Snippets
		customPoints: userPoints,
		tooltip: userTooltip
	}: {
		data: Record<string, unknown>[];
		x: string;
		y?: string;
		config: ChartConfig;
		preset?: LinePreset;
		curve?: CurveType;
		showPoints?: boolean;
		pointRadius?: number;
		highlightPointRadius?: number;
		xScaleType?: 'time' | 'band';
		axis?: 'x' | false;
		xAxisFormat?: (v: unknown) => string;
		colorFn?: (v: Record<string, unknown>) => string;
		yPadding?: [number, number];
		labels?: Record<string, unknown> | boolean;
		tooltipHideLabel?: boolean;
		tooltipIndicator?: 'dot' | 'line' | 'dashed';
		tooltipLabelFormatter?: (value: unknown, payload: unknown[]) => string | number;
		title?: string;
		description?: string;
		cardClass?: string;
		cardContentClass?: string;
		containerClass?: string;
		footerTrend?: string;
		footerTrendIcon?: Component;
		footerDateRange?: string;
		lineChartProps?: LayerLineChartProps;
		customPoints?: Snippet<[LineChartSnippetParams]>;
		tooltip?: Snippet;
	} = $props();

	// ─── Derived values ──────────────────────────────────────────────────────────

	const p = $derived(PRESETS[preset] ?? PRESETS.default);

	const resolvedCurve = $derived(CURVES[curveOverride ?? p.curve]);
	const resolvedShowPoints = $derived(showPointsOverride ?? p.showPoints);
	const resolvedPointRadius = $derived(pointRadiusOverride ?? p.pointRadius);
	const resolvedHighlightPointRadius = $derived(
		highlightPointRadiusOverride ?? p.highlightPointRadius
	);

	const resolvedXScale = $derived(xScaleType === 'band' ? scaleBand() : scaleUtc());

	// Auto-build series from config keys intersecting with data keys
	const seriesKeys = $derived(Object.keys(config).filter((k) => k in (data[0] ?? {})));
	const series = $derived(
		seriesKeys.map((key) => {
			const cfg = config[key] as { label?: string; color?: string } | undefined;
			return {
				key,
				label: cfg?.label ?? key,
				color: cfg?.color ?? `var(--chart-1)`
			};
		})
	);

	const resolvedPoints = $derived(
		resolvedShowPoints && resolvedPointRadius > 0 ? { r: resolvedPointRadius } : undefined
	);
	const resolvedPointProps = $derived(
		resolvedPoints
			? ({
					...resolvedPoints,
					...lineChartProps?.points
				} satisfies LayerPointProps)
			: undefined
	);
</script>

<Card.Root class={cardClass}>
	{#if title || description}
		<Card.Header>
			{#if title}
				<Card.Title>{title}</Card.Title>
			{/if}
			{#if description}
				<Card.Description>{description}</Card.Description>
			{/if}
		</Card.Header>
	{/if}

	<Card.Content class={cardContentClass}>
		<Chart.Container {config} class={containerClass}>
			<LineChart
				{data}
				{x}
				{y}
				{series}
				{axis}
				xScale={resolvedXScale}
				{yPadding}
				{labels}
				c={colorFn}
				props={{
					spline: {
						curve: resolvedCurve,
						motion: 'tween',
						strokeWidth: 2
					},
					xAxis: {
						format: xAxisFormat ?? defaultXAxisFormat
					},
					highlight: {
						points: {
							motion: 'none',
							r: resolvedHighlightPointRadius
						}
					},
					...lineChartProps,
					points: resolvedPointProps
				}}
			>
				{#snippet points(snippetParams: LineChartSnippetParams)}
					{#if userPoints}
						{@render userPoints(snippetParams)}
					{:else if resolvedPointProps}
						{#each snippetParams.context.series.visibleSeries as s (s.key)}
							<Points seriesKey={s.key} {...resolvedPointProps} {...s.props} />
						{/each}
					{/if}
				{/snippet}

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

	{#if footerTrend || footerDateRange}
		<Card.Footer>
			<div class="flex w-full items-start gap-2 text-sm">
				<div class="grid gap-2">
					{#if footerTrend}
						<div class="flex items-center gap-2 leading-none font-medium">
							{footerTrend}
							{#if footerTrendIcon}
								<footerTrendIcon class="size-4"></footerTrendIcon>
							{:else}
								<TrendingUpIcon class="size-4"></TrendingUpIcon>
							{/if}
						</div>
					{/if}
					{#if footerDateRange}
						<div class="flex items-center gap-2 leading-none text-muted-foreground">
							{footerDateRange}
						</div>
					{/if}
				</div>
			</div>
		</Card.Footer>
	{/if}
</Card.Root>
