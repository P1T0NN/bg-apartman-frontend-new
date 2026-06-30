// SVELTEKIT IMPORTS
import { redirect } from '@sveltejs/kit';

// CONFIG
import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/routeEndpoints.js';

// UTILS
import { localizedPath } from '@/utils/localizedPath';

// TYPES
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	const { locals } = event;
	
	if (!locals.token) {
		throw redirect(302, localizedPath(event, UNPROTECTED_PAGE_ENDPOINTS.LOGIN));
	}
};

