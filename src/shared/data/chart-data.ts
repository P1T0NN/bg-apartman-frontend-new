/**
 * Shared chart test data — used for development and demo purposes.
 * Replace with real analytics queries in production.
 */

/** Monthly visitor data — usable by area, line, and bar charts. */
export const monthlyVisitorData = [
	{ month: 'January', desktop: 186, mobile: 80 },
	{ month: 'February', desktop: 305, mobile: 200 },
	{ month: 'March', desktop: 237, mobile: 120 },
	{ month: 'April', desktop: 73, mobile: 190 },
	{ month: 'May', desktop: 209, mobile: 130 },
	{ month: 'June', desktop: 214, mobile: 140 }
];

/** Monthly visitor data with longer range — 12 months. */
export const yearlyVisitorData = [
	{ month: 'Jan', desktop: 186, mobile: 80 },
	{ month: 'Feb', desktop: 305, mobile: 200 },
	{ month: 'Mar', desktop: 237, mobile: 120 },
	{ month: 'Apr', desktop: 73, mobile: 190 },
	{ month: 'May', desktop: 209, mobile: 130 },
	{ month: 'Jun', desktop: 214, mobile: 140 },
	{ month: 'Jul', desktop: 260, mobile: 180 },
	{ month: 'Aug', desktop: 190, mobile: 210 },
	{ month: 'Sep', desktop: 310, mobile: 150 },
	{ month: 'Oct', desktop: 280, mobile: 170 },
	{ month: 'Nov', desktop: 220, mobile: 160 },
	{ month: 'Dec', desktop: 340, mobile: 200 }
];

/** Single-series data — for simple line/bar charts. */
export const singleSeriesData = [
	{ month: 'January', value: 186 },
	{ month: 'February', value: 305 },
	{ month: 'March', value: 237 },
	{ month: 'April', value: 73 },
	{ month: 'May', value: 209 },
	{ month: 'June', value: 214 }
];

/** Browser distribution — usable by pie, donut, and radar charts. */
export const browserData = [
	{ browser: 'Chrome', visitors: 275, fill: 'var(--color-chrome)' },
	{ browser: 'Safari', visitors: 200, fill: 'var(--color-safari)' },
	{ browser: 'Firefox', visitors: 187, fill: 'var(--color-firefox)' },
	{ browser: 'Edge', visitors: 173, fill: 'var(--color-edge)' },
	{ browser: 'Other', visitors: 90, fill: 'var(--color-other)' }
];

/** Multi-category data — for grouped/stacked bar charts. */
export const multiCategoryData = [
	{ category: 'Q1', productA: 400, productB: 240, productC: 320 },
	{ category: 'Q2', productA: 300, productB: 139, productC: 280 },
	{ category: 'Q3', productA: 200, productB: 980, productC: 410 },
	{ category: 'Q4', productA: 278, productB: 390, productC: 500 }
];
