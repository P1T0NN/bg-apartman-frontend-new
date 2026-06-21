import type { ChartConfig } from '@/shared/components/ui/chart/chart-utils.js';

export type ChartDatum = Record<string, unknown>;

export type InteractiveChartSeries = {
	key: string;
	label: string;
	color?: string;
};

export type AnalyticsChartScope = {
	type: string;
	id: string;
};

export type AnalyticsChartRange = {
	from: number;
	to: number;
};

export type AnalyticsChartUnit = 'count' | 'currency' | 'bytes' | (string & {});

export type AnalyticsTimeSeriesDatum = Record<string, number> & {
	date: number;
};

export type AnalyticsTimeSeriesResult = {
	data: AnalyticsTimeSeriesDatum[];
	x: string;
	config: ChartConfig;
	meta: {
		metric: string;
		label: string;
		unit: AnalyticsChartUnit;
		scope: AnalyticsChartScope;
		groupBy?: string;
		seriesKeys: string[];
		omittedSeriesCount?: number;
		xValueType: 'timestamp';
		range: AnalyticsChartRange;
	};
};

export type AnalyticsBreakdownDatum = {
	key: string;
	value: number;
	color?: string;
};

export type AnalyticsBreakdownResult = {
	data: AnalyticsBreakdownDatum[];
	config: ChartConfig;
	meta: {
		metric: string;
		label: string;
		unit: AnalyticsChartUnit;
		scope: AnalyticsChartScope;
		groupBy: string;
		omittedSeriesCount?: number;
		range: AnalyticsChartRange;
	};
};

export type AnalyticsSummaryResult = {
	metric: string;
	label: string;
	unit: AnalyticsChartUnit;
	scope: AnalyticsChartScope;
	value: number;
	range: AnalyticsChartRange;
};
