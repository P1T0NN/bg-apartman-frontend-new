// SVELTEKIT IMPORTS
import { redirect } from '@sveltejs/kit';

// LIBRARIES
import { localizeHref } from '@/shared/lib/paraglide/runtime';

// CONFIG
import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/routeEndpoints';

// TYPES
import type { PageLoad } from './$types';

/**
 * The URL *is* the query here, so a hand-written one has to hold up: `location` is what the
 * search is anchored to, and a blank param (`?guests=&location=`) is a query for nothing.
 * Either way there's no search to run — bounce home rather than render an empty result set.
 * nuqs drops a param when it's set back to its default, so it never writes a blank one itself.
 */
export const load: PageLoad = ({ url }) => {
	const location = url.searchParams.get('location')?.trim();
	const hasBlankParam = [...url.searchParams.values()].some((value) => !value.trim());

	if (!location || hasBlankParam) {
		redirect(307, localizeHref(UNPROTECTED_PAGE_ENDPOINTS.ROOT));
	}
};
