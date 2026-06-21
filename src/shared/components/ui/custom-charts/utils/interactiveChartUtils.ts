import type { ChartConfig } from '@/shared/components/ui/chart/chart-utils.js';
import type { ChartDatum, InteractiveChartSeries } from '../types/chartTypes';

export function getInteractiveSeriesKeys(
	data: ChartDatum[],
	config: ChartConfig,
	excludedKeys: string[] = []
) {
	const firstDatum = data[0] ?? {};
	const excluded = new Set(excludedKeys);

	return Object.keys(config).filter((key) => !excluded.has(key) && key in firstDatum);
}

export function getInteractiveSeries(config: ChartConfig, keys: string[]) {
	return keys.map((key) => {
		const cfg = config[key];

		return {
			key,
			label: cfg?.label ?? key,
			color: cfg?.color
		} satisfies InteractiveChartSeries;
	});
}

export function getNumericSeriesTotals(data: ChartDatum[], keys: string[]) {
	const totals: Record<string, number> = {};

	for (const key of keys) {
		totals[key] = data.reduce((total, item) => {
			const value = item[key];
			return typeof value === 'number' ? total + value : total;
		}, 0);
	}

	return totals;
}

export function formatDateValue(
	value: unknown,
	locale: string,
	options: Intl.DateTimeFormatOptions
) {
	if (value instanceof Date) return value.toLocaleDateString(locale, options);
	return String(value);
}
