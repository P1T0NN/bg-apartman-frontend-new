/**
 * Whole-unit currency formatting — the one product rule ("no cents anywhere") shared by the
 * Svelte UI (`formatters.formatCurrency`) and the Convex email templates. Locale is a
 * parameter because the two runtimes resolve it differently (Paraglide `getLocale()` vs the
 * recipient's stored locale).
 */
export function formatMoney(amount: number, locale: string, currency = 'EUR'): string {
	return new Intl.NumberFormat(locale, {
		style: 'currency',
		currency,
		maximumFractionDigits: 0
	}).format(amount);
}
