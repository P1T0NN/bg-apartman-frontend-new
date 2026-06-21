<script lang="ts">
	import { LineChart } from 'layerchart';
	import { curveLinearClosed } from 'd3-shape';
	import { scaleBand } from 'd3-scale';
	import * as Card from '@/shared/components/ui/card/index.js';
	import * as Chart from '@/shared/components/ui/chart/index.js';
	import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
	import type { Snippet, Component, ComponentProps } from 'svelte';
	import type { ChartConfig } from '@/shared/components/ui/chart/chart-utils.js';

	// ─── Presets ─────────────────────────────────────────────────────────────────

	type RadarPreset =
		| 'default'
		| 'dots'
		| 'lines-only'
		| 'grid-circle'
		| 'grid-circle-no-lines'
		| 'grid-circle-filled'
		| 'grid-filled'
		| 'grid-none';
	type LayerLineChartProps = ComponentProps<typeof LineChart>;
	type LayerLineChartNestedProps = NonNullable<LayerLineChartProps['props']>;
	type LayerSplineProps = NonNullable<LayerLineChartNestedProps['spline']>;

	interface PresetConfig {
		gridType: 'linear' | 'circle';
		gridX: boolean;
		gridFilled: boolean;
		gridFillOpacity: number;
		showPoints: boolean;
		pointRadius: number;
		showFill: boolean;
		fillOpacity: number;
		strokeWidth: number;
	}

	const PRESETS: Record<RadarPreset, PresetConfig> = {
		default: {
			gridType: 'linear',
			gridX: true,
			gridFilled: false,
			gridFillOpacity: 0,
			showPoints: false,
			pointRadius: 0,
			showFill: true,
			fillOpacity: 0.6,
			strokeWidth: 0
		},
		dots: {
			gridType: 'linear',
			gridX: true,
			gridFilled: false,
			gridFillOpacity: 0,
			showPoints: true,
			pointRadius: 4,
			showFill: true,
			fillOpacity: 0.6,
			strokeWidth: 0
		},
		'lines-only': {
			gridType: 'linear',
			gridX: false,
			gridFilled: false,
			gridFillOpacity: 0,
			showPoints: false,
			pointRadius: 0,
			showFill: false,
			fillOpacity: 0,
			strokeWidth: 2
		},
		'grid-circle': {
			gridType: 'circle',
			gridX: true,
			gridFilled: false,
			gridFillOpacity: 0,
			showPoints: true,
			pointRadius: 4,
			showFill: true,
			fillOpacity: 0.6,
			strokeWidth: 0
		},
		'grid-circle-no-lines': {
			gridType: 'circle',
			gridX: false,
			gridFilled: false,
			gridFillOpacity: 0,
			showPoints: true,
			pointRadius: 4,
			showFill: true,
			fillOpacity: 0.6,
			strokeWidth: 0
		},
		'grid-circle-filled': {
			gridType: 'circle',
			gridX: true,
			gridFilled: true,
			gridFillOpacity: 0.2,
			showPoints: false,
			pointRadius: 0,
			showFill: true,
			fillOpacity: 0.5,
			strokeWidth: 0
		},
		'grid-filled': {
			gridType: 'linear',
			gridX: true,
			gridFilled: true,
			gridFillOpacity: 0.2,
			showPoints: false,
			pointRadius: 0,
			showFill: true,
			fillOpacity: 0.5,
			strokeWidth: 0
		},
		'grid-none': {
			gridType: 'linear',
			gridX: true,
			gridFilled: false,
			gridFillOpacity: 0,
			showPoints: true,
			pointRadius: 4,
			showFill: true,
			fillOpacity: 0.6,
			strokeWidth: 0
		}
	};

	// ─── Props ───────────────────────────────────────────────────────────────────

	let {
		data,
		x,
		config,
		title,
		description,
		cardClass,
		cardHeaderClass = 'items-center',
		cardContentClass = 'flex-1',
		containerClass = 'mx-auto aspect-square max-h-[250px]',
		preset = 'default' as RadarPreset,
		// Grid overrides
		gridType: gridTypeOverride,
		gridX: gridXOverride,
		gridFilled: gridFilledOverride,
		gridFillOpacity: gridFillOpacityOverride,
		// Point overrides
		showPoints: showPointsOverride,
		pointRadius: pointRadiusOverride,
		// Fill/Stroke overrides
		showFill: showFillOverride,
		fillOpacity: fillOpacityOverride,
		strokeWidth: strokeWidthOverride,
		// Layout
		padding = 12,
		yPadding,
		legend,
		tickLength,
		// Footer
		footerTrend,
		footerTrendIcon,
		footerDateRange,
		footerClass,
		// Extra props
		lineChartProps,
		// Snippets
		axis: userAxis,
		customGrid: userGrid,
		tooltip: userTooltip
	}: {
		data: Record<string, unknown>[];
		x: string;
		config: ChartConfig;
		title?: string;
		description?: string;
		cardClass?: string;
		cardHeaderClass?: string;
		cardContentClass?: string;
		containerClass?: string;
		preset?: RadarPreset;
		gridType?: 'linear' | 'circle';
		gridX?: boolean;
		gridFilled?: boolean;
		gridFillOpacity?: number;
		showPoints?: boolean;
		pointRadius?: number;
		showFill?: boolean;
		fillOpacity?: number;
		strokeWidth?: number;
		padding?: number;
		yPadding?: [number, number];
		legend?: Record<string, unknown> | boolean;
		tickLength?: number;
		footerTrend?: string;
		footerTrendIcon?: Component;
		footerDateRange?: string;
		footerClass?: string;
		lineChartProps?: LayerLineChartNestedProps;
		axis?: LayerLineChartProps['axis'];
		customGrid?: LayerLineChartProps['grid'];
		tooltip?: Snippet;
	} = $props();

	// ─── Derived values ──────────────────────────────────────────────────────────

	const p = $derived(PRESETS[preset] ?? PRESETS.default);

	const resolvedGridType = $derived(gridTypeOverride ?? p.gridType);
	const resolvedGridX = $derived(gridXOverride ?? p.gridX);
	const resolvedGridFilled = $derived(gridFilledOverride ?? p.gridFilled);
	const resolvedGridFillOpacity = $derived(gridFillOpacityOverride ?? p.gridFillOpacity);
	const resolvedShowPoints = $derived(showPointsOverride ?? p.showPoints);
	const resolvedPointRadius = $derived(pointRadiusOverride ?? p.pointRadius);
	const resolvedShowFill = $derived(showFillOverride ?? p.showFill);
	const resolvedFillOpacity = $derived(fillOpacityOverride ?? p.fillOpacity);
	const resolvedStrokeWidth = $derived(strokeWidthOverride ?? p.strokeWidth);
	const resolvedTickLength = $derived(tickLength ?? (legend ? -8 : 0));

	// Auto-build series from config keys
	const seriesKeys = $derived(Object.keys(config).filter((k) => k in (data[0] ?? {})));
	const series = $derived(
		seriesKeys.map((key) => {
			const cfg = config[key] as { label?: string; color?: string } | undefined;
			const colorVar = `var(--color-${key})`;
			return {
				key,
				label: cfg?.label ?? key,
				color: cfg?.color ?? colorVar,
				props: {
					fill: resolvedShowFill ? (cfg?.color ?? colorVar) : 'none',
					fillOpacity: resolvedShowFill ? resolvedFillOpacity : undefined,
					stroke: resolvedShowFill ? undefined : (cfg?.color ?? colorVar),
					strokeWidth: resolvedShowFill ? undefined : resolvedStrokeWidth,
					class: resolvedShowFill ? undefined : 'fill-none'
				}
			};
		})
	);

	const points = $derived(
		resolvedShowPoints && resolvedPointRadius > 0 ? { r: resolvedPointRadius } : undefined
	);
	const resolvedGrid = $derived(preset === 'grid-none' ? false : (userGrid ?? true));

	const gridClasses = $derived(
		resolvedGridFilled
			? {
					line: `fill-(--color-${seriesKeys[0] ?? 'desktop'}) opacity-${Math.round(resolvedGridFillOpacity * 100)}!`
				}
			: undefined
	);

	const gridClass = $derived(
		resolvedGridFilled ? `fill-(--color-${seriesKeys[0] ?? 'desktop'})` : undefined
	);

	const resolvedSplineProps = $derived.by(() => {
		const props: LayerSplineProps = {
			curve: curveLinearClosed,
			motion: 'tween'
		};

		if (resolvedShowFill) {
			props.stroke = '0';
		} else {
			props.fill = 'none';
			props.fillOpacity = 0;
			props.strokeWidth = resolvedStrokeWidth;
		}

		return {
			...props,
			...lineChartProps?.spline
		};
	});
</script>

<Card.Root class={cardClass}>
	{#if title || description}
		<Card.Header class={cardHeaderClass}>
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
				{series}
				radial
				{x}
				xScale={scaleBand()}
				{padding}
				{yPadding}
				{points}
				{legend}
				axis={userAxis ?? true}
				grid={resolvedGrid}
				props={{
					spline: resolvedSplineProps,
					xAxis: {
						tickLength: resolvedTickLength
					},
					yAxis: {
						format: () => ''
					},
					grid: {
						radialY: resolvedGridType,
						x: resolvedGridX,
						class: gridClass,
						classes: gridClasses
					},
					tooltip: {
						context: {
							mode: 'voronoi'
						}
					},
					highlight: {
						lines: false,
						points: resolvedShowPoints ? { r: resolvedPointRadius } : false
					},
					...lineChartProps
				}}
			>
				{#snippet tooltip()}
					{#if userTooltip}
						{@render userTooltip()}
					{:else}
						<Chart.Tooltip />
					{/if}
				{/snippet}
			</LineChart>
		</Chart.Container>
	</Card.Content>

	{#if footerTrend || footerDateRange}
		<Card.Footer
			class={footerClass ?? (legend ? 'flex-col gap-2 pt-4 text-sm' : 'flex-col gap-2 text-sm')}
		>
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
		</Card.Footer>
	{/if}
</Card.Root>
