<script lang="ts">
	import { cubicInOut } from 'svelte/easing';
	import { scaleBand } from 'd3-scale';
	import { BarChart } from 'layerchart';
	import * as Card from '@/shared/components/ui/card/index.js';
	import * as Chart from '@/shared/components/ui/chart/index.js';
	import type { Snippet, ComponentProps } from 'svelte';
	import type { ChartConfig, TooltipPayload } from '@/shared/components/ui/chart/chart-utils.js';
	import type { TicksConfig } from 'layerchart';
	// ─── Types ───────────────────────────────────────────────────────────────────

	type LayerBarChartProps = ComponentProps<typeof BarChart>;

	type Indicator = 'dot' | 'line' | 'dashed';

	type TooltipPreset =
		| 'default'
		| 'line-indicator'
		| 'no-indicator'
		| 'no-label'
		| 'icons'
		| 'advanced';

	interface PresetConfig {
		indicator?: Indicator;
		hideLabel?: boolean;
		hideIndicator?: boolean;
	}

	interface SeriesItem {
		key: string;
		label: string;
		color: string;
		props?: Record<string, unknown>;
	}

	interface FormatterParams {
		name: string;
		value: unknown;
		index: number;
		payload: TooltipPayload[];
	}

	// ─── Presets ─────────────────────────────────────────────────────────────────

	const PRESETS: Record<TooltipPreset, PresetConfig> = {
		default: {},
		'line-indicator': { indicator: 'line' },
		'no-indicator': { hideIndicator: true },
		'no-label': { hideLabel: true, hideIndicator: true },
		icons: { hideLabel: true },
		advanced: { hideLabel: true }
	};

	// ─── Props ───────────────────────────────────────────────────────────────────

	let {
		// Data
		data,
		x,
		config,
		series,
		// Card
		title,
		description,
		cardClass,
		// Chart
		seriesLayout = 'stack',
		xAxisFormat,
		xAxisTicks,
		xAxisTickCount = 6,
		// Tooltip preset
		tooltipPreset = 'default' as TooltipPreset,
		// Tooltip individual overrides
		tooltipIndicator,
		tooltipHideLabel,
		tooltipHideIndicator,
		tooltipLabelKey,
		tooltipLabelFormatter,
		tooltipLabelClassName,
		tooltipNameKey,
		tooltipClass,
		// Enhanced tooltip features
		tooltipValueSuffix,
		tooltipShowTotal = false,
		// Snippets
		formatter,
		children
	}: {
		// Data
		data: Record<string, unknown>[];
		x: string;
		config: ChartConfig;
		series: SeriesItem[];
		// Card
		title?: string;
		description?: string;
		cardClass?: string;
		// Chart
		seriesLayout?: 'stack' | 'group';
		xAxisFormat?: (d: unknown) => string;
		xAxisTicks?: TicksConfig;
		xAxisTickCount?: number;
		// Tooltip preset
		tooltipPreset?: TooltipPreset;
		// Tooltip individual overrides
		tooltipIndicator?: Indicator;
		tooltipHideLabel?: boolean;
		tooltipHideIndicator?: boolean;
		tooltipLabelKey?: string;
		tooltipLabelFormatter?: (value: unknown, payload: TooltipPayload[]) => string | number;
		tooltipLabelClassName?: string;
		tooltipNameKey?: string;
		tooltipClass?: string;
		// Enhanced tooltip features
		tooltipValueSuffix?: string;
		tooltipShowTotal?: boolean;
		// Snippets
		formatter?: Snippet<[FormatterParams]>;
		children?: LayerBarChartProps['aboveMarks'];
	} = $props();

	// ─── Derived values ──────────────────────────────────────────────────────────

	const preset = $derived(PRESETS[tooltipPreset] ?? {});
	const resolvedIndicator = $derived(tooltipIndicator ?? preset.indicator ?? 'dot');
	const resolvedHideLabel = $derived(tooltipHideLabel ?? preset.hideLabel ?? false);
	const resolvedHideIndicator = $derived(tooltipHideIndicator ?? preset.hideIndicator ?? false);
	const resolvedClass = $derived(
		tooltipClass ?? (tooltipPreset === 'advanced' ? 'w-[180px]' : undefined)
	);
	const resolvedXAxisTicks = $derived(
		xAxisTicks ?? _createDefaultXAxisTicks(data, x, xAxisTickCount)
	);

	/** Whether we need the built-in formatter (valueSuffix / showTotal without a custom snippet). */
	const needsBuiltInFormatter = $derived(
		!formatter && (tooltipValueSuffix != null || tooltipShowTotal)
	);

	const defaultXAxisFormat = (d: unknown) => {
		try {
			return new Date(d as string | number).toLocaleDateString('en-US', {
				weekday: 'short'
			});
		} catch {
			return String(d);
		}
	};

	function _createDefaultXAxisTicks(
		rows: Record<string, unknown>[],
		key: string,
		maxTickCount: number
	) {
		if (maxTickCount <= 0 || rows.length <= maxTickCount) return undefined;

		const step = Math.ceil((rows.length - 1) / (maxTickCount - 1));
		const ticks = rows
			.filter((_, index) => index % step === 0)
			.map((row) => row[key])
			.filter((value) => value !== undefined);
		const lastValue = rows.at(-1)?.[key];

		if (lastValue !== undefined && ticks.at(-1) !== lastValue) {
			ticks.push(lastValue);
		}

		return ticks;
	}
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
	<Card.Content>
		<Chart.Container {config}>
			<BarChart
				{data}
				xScale={scaleBand().padding(0.25)}
				{x}
				axis="x"
				rule={false}
				{series}
				{seriesLayout}
				grid={false}
				highlight={false}
				aboveMarks={children}
				props={{
					bars: {
						stroke: 'none',
						motion: { type: 'tween', duration: 500, easing: cubicInOut }
					},
					xAxis: {
						format: xAxisFormat ?? defaultXAxisFormat,
						ticks: resolvedXAxisTicks,
						tickLabelProps: {
							svgProps: { y: 13 }
						}
					}
				}}
			>
				{#snippet tooltip()}
					{#if needsBuiltInFormatter}
						{#snippet builtInFormatter({ name, value, index, payload }: FormatterParams)}
							<div class="flex w-full flex-wrap items-center gap-2">
								<div
									style="--color-bg: {config[name]?.color ?? 'var(--chart-1)'}"
									class="size-2.5 shrink-0 rounded-[2px] bg-(--color-bg)"
								></div>
								<span class="flex-1 text-xs text-muted-foreground">
									{config[name]?.label || name}
								</span>
								<span class="font-mono font-medium text-foreground tabular-nums">
									{value}
									{#if tooltipValueSuffix}
										<span class="font-normal text-muted-foreground">
											{tooltipValueSuffix}
										</span>
									{/if}
								</span>
							</div>

							{#if tooltipShowTotal && index === payload.length - 1}
								{@const total = payload.reduce((sum, p) => sum + (Number(p.value) || 0), 0)}
								<div class="flex w-full items-center border-t pt-1.5 text-xs font-medium">
									<span>Total</span>
									<span class="ms-auto font-mono font-medium text-foreground tabular-nums">
										{total}
										{#if tooltipValueSuffix}
											<span class="font-normal text-muted-foreground">
												{tooltipValueSuffix}
											</span>
										{/if}
									</span>
								</div>
							{/if}
						{/snippet}

						<Chart.Tooltip
							indicator={resolvedIndicator}
							hideLabel={true}
							hideIndicator={resolvedHideIndicator || resolvedIndicator === 'dot'}
							labelKey={tooltipLabelKey}
							labelFormatter={tooltipLabelFormatter}
							labelClassName={tooltipLabelClassName}
							nameKey={tooltipNameKey}
							class={resolvedClass}
							formatter={builtInFormatter}
						/>
					{:else}
						<Chart.Tooltip
							indicator={resolvedIndicator}
							hideLabel={resolvedHideLabel}
							hideIndicator={resolvedHideIndicator}
							labelKey={tooltipLabelKey}
							labelFormatter={tooltipLabelFormatter}
							labelClassName={tooltipLabelClassName}
							nameKey={tooltipNameKey}
							class={resolvedClass}
							{formatter}
						/>
					{/if}
				{/snippet}
			</BarChart>
		</Chart.Container>
	</Card.Content>
</Card.Root>
