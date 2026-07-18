<script lang="ts">
	// LIBRARIES
	import { PieChart, Arc, Text } from 'layerchart';

	// COMPONENTS
	import * as Card from '@/shared/components/ui/card/index.js';
	import * as Chart from '@/shared/components/ui/chart/index.js';

	// TYPES
	import type { Snippet, Component, ComponentProps } from 'svelte';
	import type { ChartConfig } from '@/shared/components/ui/chart/chart-utils.js';

	// LUCIDE ICONS
	import TrendingUpIcon from '@lucide/svelte/icons/trending-up';

	// ─── Presets ─────────────────────────────────────────────────────────────────

	type PiePreset = 'default' | 'donut' | 'donut-active' | 'donut-text' | 'legend' | 'stacked';
	type LayerPieChartProps = ComponentProps<typeof PieChart>;
	type LayerPieChartNestedProps = NonNullable<LayerPieChartProps['props']>;
	type LayerArcProps = ComponentProps<typeof Arc>;
	type PieSeries = NonNullable<LayerPieChartProps['series']>;
	type PieArcSnippetParams = Parameters<NonNullable<LayerPieChartProps['arc']>>[0];

	interface PresetConfig {
		innerRadius: number;
		padding: number;
		activeFirstSlice: boolean;
		showLegend: boolean;
		showCenterText: boolean;
	}

	const PRESETS: Record<PiePreset, PresetConfig> = {
		default: {
			innerRadius: 0,
			padding: 0,
			activeFirstSlice: false,
			showLegend: false,
			showCenterText: false
		},
		donut: {
			innerRadius: 60,
			padding: 29,
			activeFirstSlice: false,
			showLegend: false,
			showCenterText: false
		},
		'donut-active': {
			innerRadius: 60,
			padding: 29,
			activeFirstSlice: true,
			showLegend: false,
			showCenterText: false
		},
		'donut-text': {
			innerRadius: 60,
			padding: 28,
			activeFirstSlice: false,
			showLegend: false,
			showCenterText: true
		},
		legend: {
			innerRadius: 0,
			padding: 0,
			activeFirstSlice: false,
			showLegend: true,
			showCenterText: false
		},
		stacked: {
			innerRadius: 0,
			padding: 29,
			activeFirstSlice: false,
			showLegend: false,
			showCenterText: false
		}
	};

	let {
		// Standard mode
		data,
		key,
		value,
		colorKey = 'color',
		// Series mode (stacked)
		series,
		// Config
		config,
		// Preset + overrides
		preset = 'default' as PiePreset,
		innerRadius: innerRadiusOverride,
		padding: paddingOverride,
		labelKey,
		labelFormatter,
		strokeWidth,
		// Center text
		centerValue,
		centerLabel,
		centerValueClass = 'fill-foreground text-3xl! font-bold',
		centerLabelClass = 'fill-muted-foreground! text-muted-foreground',
		// Card
		title,
		description,
		cardClass = 'flex flex-col',
		cardHeaderClass = 'items-center',
		cardContentClass = 'flex-1',
		containerClass = 'mx-auto aspect-square max-h-[250px]',
		// Footer
		footerTrend,
		footerTrendIcon,
		footerDateRange,
		// Extra props
		pieChartProps,
		// Snippets
		arc: userArc,
		aboveMarks: userAboveMarks,
		tooltip: userTooltip
	}: {
		data?: Record<string, unknown>[];
		key?: string;
		value?: string;
		colorKey?: string;
		series?: PieSeries;
		config: ChartConfig;
		preset?: PiePreset;
		innerRadius?: number;
		padding?: number;
		labelKey?: string;
		labelFormatter?: (d: unknown) => string;
		strokeWidth?: number;
		centerValue?: string | number;
		centerLabel?: string;
		centerValueClass?: string;
		centerLabelClass?: string;
		title?: string;
		description?: string;
		cardClass?: string;
		cardHeaderClass?: string;
		cardContentClass?: string;
		containerClass?: string;
		footerTrend?: string;
		footerTrendIcon?: Component;
		footerDateRange?: string;
		pieChartProps?: LayerPieChartNestedProps;
		arc?: Snippet<[PieArcSnippetParams]>;
		aboveMarks?: Snippet;
		tooltip?: Snippet;
	} = $props();

	// ─── Derived values ──────────────────────────────────────────────────────────

	const p = $derived(PRESETS[preset] ?? PRESETS.default);

	const resolvedInnerRadius = $derived(innerRadiusOverride ?? p.innerRadius);
	const resolvedPadding = $derived(paddingOverride ?? p.padding);
	const resolvedShowLegend = $derived(p.showLegend);
	const resolvedActiveFirstSlice = $derived(p.activeFirstSlice);
	const resolvedShowCenterText = $derived(p.showCenterText);
	const resolvedIsStacked = $derived(preset === 'stacked');
	const resolvedStrokeWidth = $derived(strokeWidth ?? (preset === 'donut-active' ? 5 : undefined));
	const resolvedPieProps = $derived({
		motion: 'tween',
		...pieChartProps?.pie
	} satisfies LayerPieChartNestedProps['pie']);
	const resolvedArcProps = $derived({
		...(resolvedStrokeWidth ? { strokeWidth: resolvedStrokeWidth } : {}),
		...pieChartProps?.arc
	} satisfies LayerPieChartNestedProps['arc']);

	const cRange = $derived(data ? data.map((d) => String(d[colorKey] ?? '')) : undefined);

	// Center text derived values
	const resolvedCenterValue = $derived(
		centerValue ??
			(data ? data.reduce((sum, d) => sum + (Number(value ? d[value] : 0) || 0), 0) : undefined)
	);
	const resolvedCenterLabel = $derived(
		centerLabel ?? (config[value ?? ''] as { label?: string } | undefined)?.label ?? ''
	);
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
			<PieChart
				{data}
				{key}
				{value}
				{cRange}
				c={colorKey}
				label={labelFormatter ?? labelKey}
				innerRadius={resolvedInnerRadius}
				padding={resolvedPadding}
				series={resolvedIsStacked ? series : undefined}
				legend={resolvedShowLegend ? true : undefined}
				props={{
					...pieChartProps,
					pie: resolvedPieProps,
					arc: resolvedArcProps
				}}
			>
				{#snippet aboveMarks()}
					{#if userAboveMarks}
						{@render userAboveMarks()}
					{:else if resolvedShowCenterText}
						<Text
							value={String(resolvedCenterValue)}
							textAnchor="middle"
							verticalAnchor="middle"
							class={centerValueClass}
							dy={3}
						/>
						<Text
							value={resolvedCenterLabel}
							textAnchor="middle"
							verticalAnchor="middle"
							class={centerLabelClass}
							dy={22}
						/>
					{/if}
				{/snippet}

				{#snippet arc(snippetParams: PieArcSnippetParams)}
					{#if userArc}
						{@render userArc(snippetParams)}
					{:else}
						{@const arcProps =
							resolvedActiveFirstSlice && snippetParams.index === 0
								? ({
										...snippetParams.props,
										outerRadius: 60,
										innerRadius: 105
									} satisfies LayerArcProps)
								: snippetParams.props}
						<Arc {...arcProps} />
					{/if}
				{/snippet}

				{#snippet tooltip()}
					{#if userTooltip}
						{@render userTooltip()}
					{:else}
						<Chart.Tooltip hideLabel />
					{/if}
				{/snippet}
			</PieChart>
		</Chart.Container>
	</Card.Content>

	{#if footerTrend || footerDateRange}
		<Card.Footer class="flex-col gap-2 text-sm">
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
				<div class="leading-none text-muted-foreground">
					{footerDateRange}
				</div>
			{/if}
		</Card.Footer>
	{/if}
</Card.Root>
