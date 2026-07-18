<script lang="ts">
	// LIBRARIES
	import { scaleUtc } from 'd3-scale';
	import { curveMonotoneX } from 'd3-shape';
	import { Area, AreaChart, ChartClipPath } from 'layerchart';
	import { cubicInOut } from 'svelte/easing';

	// COMPONENTS
	import * as Card from '@/shared/components/ui/card/index.js';
	import * as Chart from '@/shared/components/ui/chart/index.js';
	import TimeRangeData, {
		filterTimeRangeData,
		formatTimeRangeLabel,
		toCalendarDate,
		type TimeRangeOption,
		type TimeRangeValue
	} from './timerange-data.svelte';

	// TYPES
	import type { DateRange } from 'bits-ui';
	import type { ComponentProps, Snippet } from 'svelte';
	import type { ChartConfig } from '@/shared/components/ui/chart/chart-utils.js';

	type ChartDatum = Record<string, unknown>;
	type DateAccessor = string | ((item: ChartDatum) => Date);
	type LayerAreaProps = Partial<ComponentProps<typeof Area>>;
	type LayerClipPathProps = Partial<ComponentProps<typeof ChartClipPath>>;
	type LayerAreaChartProps = {
		area?: LayerAreaProps;
		xAxis?: Record<string, unknown>;
		yAxis?: Record<string, unknown>;
		[key: string]: unknown;
	};
	type AreaSeries = {
		key: string;
		label?: string;
		color?: string;
		props?: LayerAreaProps;
	};
	type AreaChartSnippetParams = {
		context: {
			series: {
				visibleSeries: AreaSeries[];
			};
		};
	};

	const FALLBACK_DATE = new Date(0);

	function getDatumDate(item: ChartDatum | undefined, accessor: DateAccessor) {
		if (!item) return undefined;

		const value = typeof accessor === 'function' ? accessor(item) : item[accessor];
		return value instanceof Date ? value : undefined;
	}

	function formatDate(value: unknown, locale: string, options: Intl.DateTimeFormatOptions) {
		if (value instanceof Date) return value.toLocaleDateString(locale, options);
		return String(value);
	}

	function toSvgIdSegment(value: string) {
		return value.replace(/[^a-zA-Z0-9_-]/g, '-');
	}

	const uid = $props.id();

	let {
		data,
		x,
		config,
		// Time range
		timeRange = $bindable<TimeRangeValue>('90d'),
		customRange = $bindable<DateRange | undefined>(),
		timeRangeOptions,
		snapToMonths = false,
		minDays,
		dateAccessor,
		referenceDate,
		minDate,
		maxDate,
		locale = 'en-US',
		timeZone,
		// Chart
		series: seriesOverride,
		seriesLayout = 'stack',
		showLegend = true,
		axis = 'x',
		xAxisFormat,
		yAxisFormat = () => '',
		tooltipLabelFormatter,
		tooltipIndicator = 'line',
		tooltipNameKey,
		fillOpacity = 0.4,
		gradientStartOpacity = 1,
		gradientEndOpacity = 0.1,
		// Card
		title = 'Area Chart - Interactive',
		description,
		descriptionPrefix = 'Showing total visitors for',
		cardClass,
		cardHeaderClass = 'flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row',
		cardContentClass,
		containerClass = '-ml-3 aspect-auto h-62.5 w-full',
		// Extra props
		areaChartProps,
		clipPathProps,
		// Snippets
		customMarks: userMarks,
		tooltip: userTooltip
	}: {
		data: ChartDatum[];
		x: string;
		config: ChartConfig;
		timeRange?: TimeRangeValue;
		customRange?: DateRange;
		timeRangeOptions?: TimeRangeOption[];
		/** For monthly-bucketed data: custom ranges widen to whole months so no bucket is dropped. */
		snapToMonths?: boolean;
		/** Minimum days a custom range must span (enforced by the calendar). */
		minDays?: number;
		dateAccessor?: DateAccessor;
		referenceDate?: Date;
		minDate?: Date;
		maxDate?: Date;
		locale?: string;
		timeZone?: string;
		series?: AreaSeries[];
		seriesLayout?: 'stack' | 'stackExpand';
		showLegend?: boolean;
		axis?: 'x' | false;
		xAxisFormat?: (value: unknown) => string;
		yAxisFormat?: (value?: unknown) => string;
		tooltipLabelFormatter?: (value: unknown) => string;
		tooltipIndicator?: 'dot' | 'line' | 'dashed';
		tooltipNameKey?: string;
		fillOpacity?: number;
		gradientStartOpacity?: number;
		gradientEndOpacity?: number;
		title?: string;
		description?: string;
		descriptionPrefix?: string;
		cardClass?: string;
		cardHeaderClass?: string;
		cardContentClass?: string;
		containerClass?: string;
		areaChartProps?: LayerAreaChartProps;
		clipPathProps?: LayerClipPathProps;
		customMarks?: Snippet<[AreaChartSnippetParams]>;
		tooltip?: Snippet;
	} = $props();

	const resolvedDateAccessor = $derived(dateAccessor ?? x);
	const dateExtent = $derived.by(() => {
		let firstDate: Date | undefined;
		let lastDate: Date | undefined;

		for (const item of data) {
			const date = getDatumDate(item, resolvedDateAccessor);
			if (!date) continue;

			if (!firstDate || date < firstDate) firstDate = date;
			if (!lastDate || date > lastDate) lastDate = date;
		}

		return { firstDate, lastDate };
	});
	const resolvedReferenceDate = $derived(referenceDate ?? dateExtent.lastDate ?? FALLBACK_DATE);
	const resolvedMinDate = $derived(minDate ?? dateExtent.firstDate ?? resolvedReferenceDate);
	const resolvedMaxDate = $derived(maxDate ?? dateExtent.lastDate ?? resolvedReferenceDate);
	const rangeLabel = $derived(
		formatTimeRangeLabel(timeRange, customRange, timeRangeOptions, locale, timeZone, snapToMonths)
	);
	const rangeDescription = $derived(timeRange === 'custom' ? rangeLabel : rangeLabel.toLowerCase());
	const resolvedDescription = $derived(description ?? `${descriptionPrefix} ${rangeDescription}`);
	const filteredData = $derived(
		filterTimeRangeData({
			data,
			dateAccessor: resolvedDateAccessor,
			value: timeRange,
			customRange,
			referenceDate: resolvedReferenceDate,
			options: timeRangeOptions,
			timeZone,
			snapToMonths
		})
	);

	// With few points (e.g. monthly buckets), let every bucket have its own axis tick —
	// d3's auto ticks over a short domain otherwise collapse to a single label.
	const xTicks = $derived.by(() => {
		if (filteredData.length === 0 || filteredData.length > 13) return undefined;
		const dates = filteredData
			.map((item) => getDatumDate(item, resolvedDateAccessor))
			.filter((date): date is Date => date !== undefined);
		return dates.length === filteredData.length ? dates : undefined;
	});

	const seriesKeys = $derived(
		Object.keys(config).filter((key) => key in (data[0] ?? {}) && key !== x)
	);
	const series = $derived(
		seriesOverride ??
			seriesKeys.map((key) => {
				const cfg = config[key] as { label?: string; color?: string } | undefined;
				return {
					key,
					label: cfg?.label ?? key,
					color: cfg?.color ?? `var(--chart-1)`
				};
			})
	);
	const resolvedXAxisFormat = $derived(
		xAxisFormat ??
			((value: unknown) => formatDate(value, locale, { month: 'short', day: 'numeric' }))
	);
	const resolvedTooltipLabelFormatter = $derived(
		tooltipLabelFormatter ?? ((value: unknown) => formatDate(value, locale, { month: 'long' }))
	);
	const resolvedAreaProps = $derived({
		curve: curveMonotoneX,
		fillOpacity,
		line: { class: 'stroke-1' },
		motion: 'tween',
		...areaChartProps?.area
	} satisfies LayerAreaProps);
	const resolvedClipPathProps = $derived({
		initialWidth: 0,
		motion: {
			width: { type: 'tween', duration: 1000, easing: cubicInOut }
		},
		...clipPathProps
	} satisfies LayerClipPathProps);
	const gradientIdBase = $derived(toSvgIdSegment(uid));

	function getGradientId(seriesKey: string) {
		return `${gradientIdBase}-fill-${toSvgIdSegment(seriesKey)}`;
	}

	function getGradientFill(seriesKey: string) {
		return `url(#${getGradientId(seriesKey)})`;
	}

	function getSeriesColor(seriesKey: string) {
		return `var(--color-${seriesKey})`;
	}
</script>

<Card.Root class={cardClass}>
	<Card.Header class={cardHeaderClass}>
		<div class="grid flex-1 gap-1 text-center sm:text-start">
			{#if title}
				<Card.Title>{title}</Card.Title>
			{/if}
			{#if resolvedDescription}
				<Card.Description>{resolvedDescription}</Card.Description>
			{/if}
		</div>
		<TimeRangeData
			bind:value={timeRange}
			bind:customRange
			options={timeRangeOptions}
			minValue={toCalendarDate(resolvedMinDate)}
			maxValue={toCalendarDate(resolvedMaxDate)}
			{locale}
			{timeZone}
			{snapToMonths}
			{minDays}
		/>
	</Card.Header>
	<Card.Content class={cardContentClass}>
		<Chart.Container {config} class={containerClass}>
			<AreaChart
				legend={showLegend ? true : undefined}
				data={filteredData}
				{x}
				xScale={scaleUtc()}
				{axis}
				{series}
				{seriesLayout}
				props={{
					...areaChartProps,
					xAxis: {
						ticks: timeRange === '7d' ? 7 : xTicks,
						format: resolvedXAxisFormat,
						...areaChartProps?.xAxis
					},
					yAxis: {
						format: yAxisFormat,
						...areaChartProps?.yAxis
					},
					area: resolvedAreaProps
				}}
			>
				{#snippet marks(snippetParams: AreaChartSnippetParams)}
					{#if userMarks}
						{@render userMarks(snippetParams)}
					{:else}
						<defs>
							{#each snippetParams.context.series.visibleSeries as s (s.key)}
								<linearGradient id={getGradientId(s.key)} x1="0" y1="0" x2="0" y2="1">
									<stop
										offset="5%"
										stop-color={getSeriesColor(s.key)}
										stop-opacity={gradientStartOpacity}
									/>
									<stop
										offset="95%"
										stop-color={getSeriesColor(s.key)}
										stop-opacity={gradientEndOpacity}
									/>
								</linearGradient>
							{/each}
						</defs>
						<ChartClipPath {...resolvedClipPathProps}>
							{#each snippetParams.context.series.visibleSeries as s (s.key)}
								<Area
									seriesKey={s.key}
									fill={getGradientFill(s.key)}
									{...resolvedAreaProps}
									{...s.props}
								/>
							{/each}
						</ChartClipPath>
					{/if}
				{/snippet}
				{#snippet tooltip()}
					{#if userTooltip}
						{@render userTooltip()}
					{:else}
						<Chart.Tooltip
							labelFormatter={resolvedTooltipLabelFormatter}
							indicator={tooltipIndicator}
							nameKey={tooltipNameKey}
						/>
					{/if}
				{/snippet}
			</AreaChart>
		</Chart.Container>
	</Card.Content>
</Card.Root>
