// UNIVERSAL hooks — run on both server and client.
import type { Reroute } from '@sveltejs/kit';
import { deLocalizeUrl } from '@/paraglide/runtime';

/**
 * Public pages carry a leading locale segment (`/sr/search`, `/sr`, …). Strip it
 * before route resolution so a single locale-agnostic route tree serves every
 * locale. The visible URL is unchanged (reroute is transparent, not a redirect),
 * so `event.url.pathname` / `$page.url.pathname` still expose the locale, and any
 * query string (search filters via nuqs) is preserved.
 */
export const reroute: Reroute = (request) => {
	return deLocalizeUrl(request.url).pathname;
};
