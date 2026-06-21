// LIBRARIES
import { deLocalizeUrl } from '@/shared/lib/paraglide/runtime';

// TYPES
import type { Reroute, Transport } from '@sveltejs/kit';

/** Map locale-prefixed URLs to SvelteKit route paths. Must live in hooks.ts (not hooks.server.ts). */
export const reroute: Reroute = ({ url }) => deLocalizeUrl(url).pathname;

export const transport = {} satisfies Transport;
