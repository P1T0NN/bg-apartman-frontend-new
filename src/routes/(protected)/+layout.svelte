<script lang="ts">
	// SVELTEKIT IMPORTS
	import { goto } from '$app/navigation';

	// LIBRARIES
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';
	import { localizeHref } from '@/shared/lib/paraglide/runtime';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/routeEndpoints.js';

	let { children } = $props();

	const auth = useAuth();

	// The server guard (+layout.server.ts) only checks that a Convex JWT cookie EXISTS —
	// it can be expired. When that happens the page renders, the socket auth fails, and
	// every query errors "Unauthenticated" while skeletons spin forever. Once the client
	// settles as definitively unauthenticated (token refresh failed → session dead),
	// leave for the login page instead of idling on a dead shell.
	$effect(() => {
		if (!auth.isLoading && !auth.isAuthenticated) {
			goto(localizeHref(UNPROTECTED_PAGE_ENDPOINTS.LOGIN));
		}
	});
</script>

{@render children()}
