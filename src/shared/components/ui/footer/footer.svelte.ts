// CONFIG
import {
	PROTECTED_PAGE_ENDPOINTS,
	UNPROTECTED_PAGE_ENDPOINTS
} from '@/shared/routeEndpoints.js';

export const footerLinkGroups = [
	{
		id: 'product',
		heading: 'Product',
		links: [
			{ href: UNPROTECTED_PAGE_ENDPOINTS.ROOT, label: 'Overview' },
			{ href: PROTECTED_PAGE_ENDPOINTS.DASHBOARD, label: 'Dashboard' }
		]
	},
	{
		id: 'legal',
		heading: 'Legal',
		links: [
			{
				href: UNPROTECTED_PAGE_ENDPOINTS.ROOT,
				label: 'Terms of service'
			}
		]
	},
	{
		id: 'account',
		heading: 'Account',
		links: [{ href: UNPROTECTED_PAGE_ENDPOINTS.LOGIN, label: 'Sign in' }]
	}
] as const;

/** Inline footer links — no pill chrome; matches enterprise site footers. */
export const footerLinkClass =
	'text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';
