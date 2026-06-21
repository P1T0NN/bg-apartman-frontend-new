<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useQuery } from 'convex-svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { authClient } from '@/features/auth/lib/auth-client';
	import { localizeHref } from '@/shared/lib/paraglide/runtime';

	// CLASSES
	import { authClass } from '@/features/auth/classes/authClass.svelte';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants.js';

	// COMPONENTS
	import UserTabs from '@/shared/components/pages/(protected)/admin/users/[id]/user-tabs.svelte';
	import UserPageLoading from '@/shared/components/pages/(protected)/admin/users/[id]/loading/user-page-loading.svelte';
	import UserPageEmpty from '@/shared/components/pages/(protected)/admin/users/[id]/empty/user-page-empty.svelte';
	import UserPageError from '@/shared/components/pages/(protected)/admin/users/[id]/error/user-page-error.svelte';

	// TYPES
	import type { Doc } from '@/convex/auth/component/_generated/dataModel';

	// `params.id` is typed `string | undefined` (sveltekit gives no compile-time
	// proof a dynamic segment is present). On the `[id]` route it always is at
	// runtime, but we still `'skip'` the query while missing to satisfy the type
	// — and to avoid an outright bad request if something ever changes upstream.
	const userId = $derived(page.params.id);

	const userQuery = useQuery(api.tables.users.userQueries.getUserById, () =>
		userId ? { userId } : 'skip'
	);
	const user = $derived(userQuery.data as Doc<"user"> | null | undefined);

	/**
	 * If the admin revokes their own current session — directly, or via "Revoke
	 * all" — the BA session row vanishes and `getCurrentUser` flips to `null`.
	 * Without this guard the page would just render "Failed to load user", which
	 * is technically correct but useless. Clear the (now-invalid) cookie via
	 * `signOut()` and bounce to the login page.
	 *
	 * Conditions:
	 *  - `currentUser === null` (definitely signed out, not just "still loading")
	 *  - we haven't already started the redirect (`hasRedirected` guard) — the
	 *    effect can re-fire as state ripples through `useQuery` invalidation.
	 */
	let hasRedirected = $state(false);
	$effect(() => {
		if (hasRedirected) return;
		if (authClass.currentUser !== null) return;
		hasRedirected = true;
		void authClient.signOut().finally(() => {
			goto(localizeHref(UNPROTECTED_PAGE_ENDPOINTS.LOGIN));
		});
	});
</script>

<section class="flex w-full flex-col gap-4 p-4 md:p-6">
	{#if userQuery.error}
		<UserPageError />
	{:else if user === null}
		<UserPageEmpty />
	{:else if user === undefined}
		<UserPageLoading />
	{:else}
		<UserTabs {user} />
	{/if}
</section>
