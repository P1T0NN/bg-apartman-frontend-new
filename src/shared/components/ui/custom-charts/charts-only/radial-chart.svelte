<script lang="ts">
	import { ArcChart, PieChart, Arc, Text } from 'layerchart';
	import * as Card from '@/shared/components/ui/card/index.js';
	import * as Chart from '@/shared/components/ui/chart/index.js';
	import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
	import type { Snippet, Component, ComponentProps } from 'svelte';
	import type { ChartConfig } from '@/shared/components/ui/chart/chart-utils.js';

	// ─── Presets ─────────────────────────────────────────────────────────────────

	type RadialPreset = 'default' | 'label' | 'text' | 'shape' | 'stacked';
	type LayerArcChartProps = ComponentProps<typeof ArcChart>;
	type LayerPieChartProps = ComponentProps<typeof PieChart>;
	type LayerArcProps = ComponentProps<typeof Arc>;
	type LayerArcChartNestedProps = NonNullable<LayerArcChartProps['props']>;
	type LayerPieChartNestedProps = NonNullable<LayerPieChartProps['props']>;
	type ArcChartSnippetParams = Parameters<NonNullable<LayerArcChartProps['arc']>>[0];
	type ArcChildSnippetParams = Parameters<NonNullable<LayerArcProps['children']>>[0];

	interface PresetConfig {
		outerRadius: number;
		innerRadius: number;
		padding: number;
		range: [number, number];
		cornerRadius?: number;
		trackOuterRadius?: number;
		trackInnerRadius?: number;
		tooltipContext: boolean;
		showArcLabels: boolean;
		chartType: 'arc' | 'pie';
	}

	const PRESETS: Record<RadialPreset, PresetConfig> = {
		default: {
			outerRadius: -17,
			innerRadius: -12.5,
			padding: 20,
			range: [90, -270],
			tooltipContext: true,
			showArcLabels: false,
			chartType: 'arc'
		},
		label: {
			outerRadius: -17,
			innerRadius: -12.5,
			padding: 20,
			range: [180, -180],
			tooltipContext: true,
			showArcLabels: true,
			chartType: 'arc'
		},
		text: {
			outerRadius: -20,
			innerRadius: -12,
			padding: 40,
			range: [90, -270],
			cornerRadius: 20,
			tooltipContext: false,
			showArcLabels: false,
			chartType: 'arc'
		},
		shape: {
			outerRadius: 88,
			innerRadius: 66,
			trackOuterRadius: 83,
			trackInnerRadius: 72,
			padding: 40,
			range: [90, -270],
			tooltipContext: false,
			showArcLabels: false,
			chartType: 'arc'
		},
		stacked: {
			outerRadius: 0,
			innerRadius: 76,
			padding: 29,
			range: [-90, 90],
			cornerRadius: 4,
			tooltipContext: true,
			showArcLabels: false,
			chartType: 'pie'
		}
	};

	// ─── Props ───────────────────────────────────────────────────────────────────

	let {
		data,
		label,
		value,
		colorKey = 'color',
		config,
		title,
		description,
		cardClass,
		cardHeaderClass = 'items-center',
		cardContentClass = 'flex-1',
		containerClass = 'mx-auto aspect-square max-h-[250px]',
		chartType: chartTypeOverride,
		outerRadius: outerRadiusOverride,
		innerRadius: innerRadiusOverride,
		padding: paddingOverride,
		range: rangeOverride,
		cornerRadius: cornerRadiusOverride,
		maxValue: maxValueOverride,
		trackOuterRadius: trackOuterRadiusOverride,
		trackInnerRadius: trackInnerRadiusOverride,
		centerValue,
		centerLabel,
		centerValueClass = 'fill-foreground text-4xl! font-bold',
		centerLabelClass = 'fill-muted-foreground!',
		tooltipHideLabel = true,
		tooltipNameKey,
		tooltipContext: tooltipContextOverride,
		footerTrend,
		footerTrendIcon,
		footerDateRange,
		preset = 'default' as RadialPreset,
		arcProps,
		pieProps,
		belowMarks: userBelowMarks,
		aboveMarks: userAboveMarks,
		arc: userArc,
		tooltip: userTooltip
	}: {
		data: Record<string, unknown>[];
		label: string;
		value: string;
		colorKey?: string;
		config: ChartConfig;
		title?: string;
		description?: string;
		cardClass?: string;
		cardHeaderClass?: string;
		cardContentClass?: string;
		containerClass?: string;
		chartType?: 'arc' | 'pie';
		outerRadius?: number;
		innerRadius?: number;
		padding?: number;
		range?: [number, number];
		cornerRadius?: number;
		maxValue?: number;
		trackOuterRadius?: number;
		trackInnerRadius?: number;
		centerValue?: string | number;
		centerLabel?: string;
		centerValueClass?: string;
		centerLabelClass?: string;
		tooltipHideLabel?: boolean;
		tooltipNameKey?: string;
		tooltipContext?: boolean;
		footerTrend?: string;
		footerTrendIcon?: Component;
		footerDateRange?: string;
		preset?: RadialPreset;
		arcProps?: LayerArcChartNestedProps;
		pieProps?: LayerPieChartNestedProps;
		belowMarks?: Snippet;
		aboveMarks?: Snippet;
		arc?: Snippet<[ArcChartSnippetParams]>;
		tooltip?: Snippet;
	} = $props();

	// ─── Derived values ──────────────────────────────────────────────────────────

	const p = $derived(PRESETS[preset] ?? PRESETS.default);

	const resolvedChartType = $derived(chartTypeOverride ?? p.chartType);
	const resolvedOuterRadius = $derived(outerRadiusOverride ?? p.outerRadius);
	const resolvedInnerRadius = $derived(innerRadiusOverride ?? p.innerRadius);
	const resolvedPadding = $derived(paddingOverride ?? p.padding);
	const resolvedRange = $derived(rangeOverride ?? p.range);
	const resolvedTooltipContext = $derived(tooltipContextOverride ?? p.tooltipContext);
	const resolvedCornerRadius = $derived(cornerRadiusOverride ?? p.cornerRadius);
	const resolvedTrackOuterRadius = $derived(trackOuterRadiusOverride ?? p.trackOuterRadius);
	const resolvedTrackInnerRadius = $derived(trackInnerRadiusOverride ?? p.trackInnerRadius);
	const resolvedShowArcLabels = $derived(p.showArcLabels);

	const resolvedMaxValue = $derived(
		maxValueOverride ?? Math.max(...data.map((d) => Number(d[value]) || 0))
	);

	const resolvedCenterValue = $derived(
		centerValue ?? data.reduce((sum, d) => sum + (Number(d[value]) || 0), 0)
	);
	const resolvedCenterLabel = $derived(
		centerLabel ?? (config[value as keyof typeof config] as { label?: string })?.label ?? ''
	);

	const showCenterText = $derived(centerValue !== undefined || centerLabel !== undefined);

	const arcSeries = $derived(
		data.map((d) => ({
			key: String(d[label] ?? ''),
			color: String(d[colorKey] ?? ''),
			data: [d],
			label: String(d[label] ?? '')
		}))
	);

	const resolvedTooltipNameKey = $derived(tooltipNameKey ?? label);
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
			{#if resolvedChartType === 'pie'}
				<PieChart
					{data}
					key={label}
					{value}
					c={colorKey}
					innerRadius={resolvedInnerRadius}
					padding={resolvedPadding}
					range={resolvedRange}
					cornerRadius={resolvedCornerRadius}
					props={{
						pie: { sort: null },
						...pieProps
					}}
				>
					{#snippet belowMarks()}
						{#if userBelowMarks}
							{@render userBelowMarks()}
						{/if}
					{/snippet}

					{#snippet aboveMarks()}
						{#if userAboveMarks}
							{@render userAboveMarks()}
						{:else if showCenterText}
							<Text
								value={String(resolvedCenterValue)}
								textAnchor="middle"
								verticalAnchor="middle"
								class={centerValueClass}
								dy={-24}
							/>
							<Text
								value={resolvedCenterLabel}
								textAnchor="middle"
								verticalAnchor="middle"
								class={centerLabelClass}
								dy={-4}
							/>
						{/if}
					{/snippet}

					{#snippet tooltip()}
						{#if userTooltip}
							{@render userTooltip()}
						{:else}
							<Chart.Tooltip hideLabel={tooltipHideLabel} nameKey={resolvedTooltipNameKey} />
						{/if}
					{/snippet}
				</PieChart>
			{:else}
				<ArcChart
					{label}
					{value}
					outerRadius={resolvedOuterRadius}
					innerRadius={resolvedInnerRadius}
					padding={resolvedPadding}
					range={resolvedRange}
					maxValue={resolvedMaxValue}
					cornerRadius={resolvedCornerRadius}
					trackOuterRadius={resolvedTrackOuterRadius}
					trackInnerRadius={resolvedTrackInnerRadius}
					series={arcSeries}
					tooltipContext={resolvedTooltipContext}
					props={{
						arc: { track: { fill: 'var(--muted)' }, motion: 'tween' },
						tooltip: { context: { hideDelay: 350 } },
						...arcProps
					}}
				>
					{#snippet belowMarks()}
						{#if userBelowMarks}
							{@render userBelowMarks()}
						{:else if showCenterText && !resolvedTooltipContext}
							<circle cx="0" cy="0" r="60" class="fill-background" />
						{/if}
					{/snippet}

					{#snippet aboveMarks()}
						{#if userAboveMarks}
							{@render userAboveMarks()}
						{:else if showCenterText && !resolvedTooltipContext}
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

					{#snippet arc(snippetParams: ArcChartSnippetParams)}
						{#if userArc}
							{@render userArc(snippetParams)}
						{:else if resolvedShowArcLabels}
							<Arc {...snippetParams.props}>
								{#snippet children(childParams: ArcChildSnippetParams)}
									<Text
										{...childParams.getTrackTextProps('middle', { startOffset: '1%' })}
										class="pointer-events-none capitalize select-none"
										value={snippetParams.context.series.visibleSeries[snippetParams.seriesIndex]
											.label}
										fill="white"
									/>
								{/snippet}
							</Arc>
						{:else}
							<Arc {...snippetParams.props} />
						{/if}
					{/snippet}

					{#snippet tooltip()}
						{#if userTooltip}
							{@render userTooltip()}
						{:else}
							<Chart.Tooltip hideLabel={tooltipHideLabel} nameKey={resolvedTooltipNameKey} />
						{/if}
					{/snippet}
				</ArcChart>
			{/if}
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
				<div class="flex items-center gap-2 leading-none text-muted-foreground">
					{footerDateRange}
				</div>
			{/if}
		</Card.Footer>
	{/if}
</Card.Root>
