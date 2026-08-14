// CONFIG
import { PROTECTED_PAGE_ENDPOINTS, UNPROTECTED_PAGE_ENDPOINTS } from '@/config/routeEndpoints.js';

// UTILS
import { appHref } from '@/utils/app-navigation.js';

// I18N
import { m } from '@/lib/paraglide/messages';

export function footerLinkGroups() {
	return [
		{
			id: 'product',
			heading: m['Footer.product'](),
			links: [
				{ href: appHref(UNPROTECTED_PAGE_ENDPOINTS.ROOT), label: m['Footer.overview']() },
				{ href: appHref(PROTECTED_PAGE_ENDPOINTS.DASHBOARD), label: m['Footer.dashboard']() }
			]
		},
		{
			id: 'support',
			heading: m['Footer.support'](),
			links: [
				{ href: appHref(UNPROTECTED_PAGE_ENDPOINTS.CONTACT), label: m['Footer.contact']() },
				{ href: appHref(UNPROTECTED_PAGE_ENDPOINTS.REPORT), label: m['Footer.reportAnIssue']() }
			]
		},
		{
			id: 'legal',
			heading: m['Footer.legal'](),
			links: [
				{
					href: appHref(UNPROTECTED_PAGE_ENDPOINTS.ROOT),
					label: m['Footer.termsOfService']()
				}
			]
		},
		{
			id: 'account',
			heading: m['Footer.account'](),
			links: [{ href: appHref(UNPROTECTED_PAGE_ENDPOINTS.LOGIN), label: m['Footer.signIn']() }]
		}
	] as const;
}

/** Inline footer links — no pill chrome; matches enterprise site footers. */
export const footerLinkClass =
	'text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';
