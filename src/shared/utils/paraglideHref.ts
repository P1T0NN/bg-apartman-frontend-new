/** Paths that must stay global (no /en/ or /de/ prefix). */
export function shouldSkipLocalePrefix(href: string): boolean {
	return (
		href.startsWith('/api') ||
		href.startsWith('/@') ||
		href.startsWith('/_') ||
		href.startsWith('//')
	);
}
