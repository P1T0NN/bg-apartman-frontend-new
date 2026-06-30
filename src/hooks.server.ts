// SVELTEKIT IMPORTS
import { sequence } from '@sveltejs/kit/hooks';

// LIBRARIES
import { paraglideMiddleware } from '@/shared/lib/paraglide/server';
import { getToken } from '@mmailaender/convex-better-auth-svelte/sveltekit';
import { getTextDirection } from '@/shared/lib/paraglide/runtime';
import { withServerConvexToken } from '@mmailaender/convex-svelte/sveltekit/server';

// UTILS
import { getSecurityHeaders, getHstsHeader } from '@/utils/securityHeaders.js';

// TYPES
import type { Handle } from '@sveltejs/kit';

// Security headers handle - adds security headers to all responses
const securityHeadersHandle: Handle = async ({ event, resolve }) => {
	const original = await resolve(event);

	// Clone so we can mutate headers (some responses, e.g. redirects, have immutable headers)
	const response = new Response(original.body, {
		status: original.status,
		statusText: original.statusText,
		headers: new Headers(original.headers)
	});

	const headers = getSecurityHeaders();
	for (const [key, value] of Object.entries(headers)) {
		response.headers.set(key, value);
	}

	if (event.url.protocol === 'https:') {
		response.headers.set('Strict-Transport-Security', getHstsHeader());
	}

	return response;
};

// Paraglide SSR middleware — locale detection, redirects, URL de-localization.
// https://inlang.com/m/gerre34r/library-inlang-paraglideJs/sveltekit
// https://inlang.com/m/gerre34r/library-inlang-paraglideJs/middleware
const paraglideHandle: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request: localizedRequest, locale }) => {
		event.request = localizedRequest;
		return resolve(event, {
			transformPageChunk: ({ html }) =>
				html.replace('%lang%', locale).replace('%dir%', getTextDirection(locale))
		});
	});
	
// Convex auth handle - exposes token on locals and to server-side Convex calls
const convexAuthHandle: Handle = ({ event, resolve }) => {
	const token = getToken(event.cookies);
	event.locals.token = token;
	return withServerConvexToken(token, () => resolve(event));
};

// Paraglide first (de-localize request for matchers); then convex auth, then security headers
export const handle: Handle = sequence(paraglideHandle, convexAuthHandle, securityHeadersHandle);
