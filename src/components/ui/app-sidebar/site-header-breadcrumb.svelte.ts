/**
 * Lets route content override the last auto-generated breadcrumb label (e.g. replace
 * a dynamic `[id]` segment with a human-readable title loaded client-side).
 */
class SiteHeaderBreadcrumbState {
	lastLabel = $state<string | undefined>(undefined);
}

export const siteHeaderBreadcrumb = new SiteHeaderBreadcrumbState();
