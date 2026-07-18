// CONFIG
import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/routeEndpoints.js';

// UTILS
import { isNavItemActive } from '@/utils/isNavItemActive.js';

export type NavItem = {
	href: string;
	label: string;
	/**
	 * Landing-page section this item tracks. When set, the item is active while that section is
	 * in view (scroll-spy) instead of by route match. The section element must carry this `id`.
	 */
	sectionId?: string;
};

export const navItems: readonly NavItem[] = [
	{ href: UNPROTECTED_PAGE_ENDPOINTS.ROOT, label: 'Home' },
	{ href: '/#featured-stays', label: 'Featured', sectionId: 'featured-stays' },
	{ href: '/#become-host', label: 'Become a host', sectionId: 'become-host' },
	{ href: '/#testimonials', label: 'Testimonials', sectionId: 'testimonials' },
	{ href: '/#newsletters', label: 'Newsletters', sectionId: 'newsletters' },
	{ href: UNPROTECTED_PAGE_ENDPOINTS.CONTACT, label: 'Contact' }
] as const;

export const navLinkClass =
	'text-hero-overlay-foreground/80 hover:text-hero-overlay-foreground rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-hero-overlay-foreground/40';

export const navLinkActiveClass =
	'bg-primary text-primary-foreground hover:text-primary-foreground font-semibold';

class NormalHeader {
	menuOpen = $state(false);

	closeMenu() {
		this.menuOpen = false;
	}
}

export const normalHeader = new NormalHeader();

/**
 * Landing-page scroll-spy. One shared IntersectionObserver over the nav's spied sections —
 * no scroll listeners, no layout reads. A narrow band near the top of the viewport
 * (20%–30% down) decides the active section: whichever section's box crosses it wins.
 * `null` means no section is in the band (e.g. the hero at the top) — Home lights up then.
 */
class SectionSpy {
	activeId = $state<string | null>(null);

	/** Observe sections by id; returns a cleanup for `$effect`. Missing ids are skipped. */
	observe(ids: readonly string[]): (() => void) | void {
		const els = ids
			.map((id) => document.getElementById(id))
			.filter((el): el is HTMLElement => el !== null);
		if (!els.length) return;

		const io = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) this.activeId = entry.target.id;
					else if (this.activeId === entry.target.id) this.activeId = null;
				}
			},
			{ rootMargin: '-20% 0px -70% 0px' }
		);
		for (const el of els) io.observe(el);

		return () => {
			io.disconnect();
			this.activeId = null;
		};
	}
}

export const sectionSpy = new SectionSpy();

/** Section ids the header should spy on — derived straight from `navItems`. */
export const spiedSectionIds: readonly string[] = navItems.flatMap((item) =>
	item.sectionId ? [item.sectionId] : []
);

/**
 * Single source of truth for header link highlighting (desktop + mobile drawer):
 * - Section items: active while their section is in view on the landing page.
 * - Home: active on the landing page while NO section is in view (i.e. the hero).
 * - Route items: the usual `isNavItemActive` path match.
 */
export function isHeaderItemActive(pathnameLogical: string, item: NavItem): boolean {
	const onRoot = pathnameLogical === UNPROTECTED_PAGE_ENDPOINTS.ROOT;
	if (item.sectionId) return onRoot && sectionSpy.activeId === item.sectionId;
	if (item.href === UNPROTECTED_PAGE_ENDPOINTS.ROOT) return onRoot && sectionSpy.activeId === null;
	return isNavItemActive(pathnameLogical, item.href);
}
