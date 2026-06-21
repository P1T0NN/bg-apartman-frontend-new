// CONFIG
import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants.js';

export const navItems = [
	{ href: UNPROTECTED_PAGE_ENDPOINTS.ROOT, label: 'Home' },
] as const;

export const navLinkClass =
	'text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50';

export const navLinkActiveClass =
	'text-primary bg-primary/10 font-semibold hover:bg-primary/15 hover:text-primary';

/** Compare against pathname from `deLocalizeUrl` (e.g. `/en/home` → `/home`). */
export function isNavItemActive(pathname: string, href: string): boolean {
	if (href === '/' || href === '') return pathname === '/' || pathname === '';
	return pathname === href || pathname.startsWith(`${href}/`);
}

class NormalHeader {
	menuOpen = $state(false);

	closeMenu() {
		this.menuOpen = false;
	}
}

export const normalHeader = new NormalHeader();
