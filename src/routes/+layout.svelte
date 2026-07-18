<script lang="ts">
	import './layout.css';
	import favicon from '@/shared/lib/assets/favicon.svg';

	// SVELTEKIT IMPORTS
	import { page } from '$app/state';
	import { dev } from '$app/environment';

	// LIBRARIES
	import { createSvelteAuthClient } from '@mmailaender/convex-better-auth-svelte/svelte';
	import { authClient } from '@/features/auth/lib/auth-client';
	import { useQuery } from 'convex-svelte';
	import { api } from '@/convex/_generated/api';
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';
	import { NuqsAdapter } from 'nuqs-svelte/adapters/svelte-kit';

	// CLASSES
	import { authClass, type CurrentUser } from '@/features/auth/classes/authClass.svelte';

	// COMPONENTS
	import { Toaster } from '@/shared/components/ui/sonner';
	import NormalHeader from '@/shared/components/ui/header/normal-header/normal-header.svelte';
	import Footer from '@/shared/components/ui/footer/footer.svelte';
	import AuthErrorBanner from '@/features/auth/components/auth-error-banner/auth-error-banner.svelte';

	let { children, data } = $props();

	const isAuthShellPage = $derived(
		page.route.id === '/(unprotected)/login' || page.route.id === '/(unprotected)/signup'
	);
	const isProtectedPage = $derived(page.route.id?.startsWith('/(protected)') ?? false);

	createSvelteAuthClient({
		authClient,
		getServerState: () => data.authState
	});

	// NOTE: Has to be after the `createSvelteAuthClient` call because it uses the `authClient` instance.
	const auth = useAuth();

	const currentUserResponse = useQuery(
		api.auth.queries.authQueries.getCurrentUser,
		() => (auth.isAuthenticated ? {} : 'skip'),
		() => ({
			initialData: data.currentUser ?? undefined,
			keepPreviousData: true
		})
	);

	// Push the live query into the shared store so any component can read
	// `authClass.currentUser` without re-subscribing. On sign-out, hand consumers a
	// definitive "signed out, not loading" so nothing waits forever (FixAuth.md §3).
	$effect(() => {
		if (!auth.isAuthenticated) {
			authClass.syncFromCurrentUserQuery(null, false);
			return;
		}
		const user = currentUserResponse.data as CurrentUser | null | undefined;
		authClass.syncFromCurrentUserQuery(user, currentUserResponse.isLoading);
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	{#if dev}
		<script
			defer
			src="https://umami-sable-iota.vercel.app/script.js"
			data-website-id="b8f657d5-dddc-4c34-bdda-2da1cf55e58f"
		></script>
	{/if}
</svelte:head>

<div class="flex min-h-dvh flex-col">
	{#if !isAuthShellPage && !isProtectedPage}
		<NormalHeader changeBgOnScroll={true} />
	{/if}
	<div class="min-h-0 flex-1">
		<NuqsAdapter>
			{@render children()}
		</NuqsAdapter>
	</div>
	{#if !isAuthShellPage && !isProtectedPage}
		<Footer />
	{/if}
</div>
<Toaster richColors />
<AuthErrorBanner />
