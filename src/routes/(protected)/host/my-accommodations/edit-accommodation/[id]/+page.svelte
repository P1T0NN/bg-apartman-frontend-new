<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useQuery } from 'convex-svelte';
	import { page } from '$app/state';

	// CLASSES
	import { siteHeaderBreadcrumb } from '@/components/ui/app-sidebar/site-header-breadcrumb.svelte.js';

	// COMPONENTS
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import EditAccommodationTabs from '@/components/pages/(protected)/host/edit-accommodation/edit-accommodation-tabs.svelte';
	import EditAccommodationPageLoading from '@/components/pages/(protected)/host/edit-accommodation/loading/edit-accommodation-page-loading.svelte';
	import EditAccommodationPageEmpty from '@/components/pages/(protected)/host/edit-accommodation/empty/edit-accommodation-page-empty.svelte';
	import { ErrorComponent } from '@/components/ui/error-component/index.js';

	// TYPES
	import type { Doc, Id } from '@/convex/_generated/dataModel';

	// `params.id` is `string | undefined` (SvelteKit gives no compile-time proof a
	// dynamic segment is present). On `[id]` it always is at runtime; `'skip'` while
	// missing satisfies the type and avoids a bad request.
	const id = $derived(page.params.id);

	const accommodationQuery = useQuery(
		api.tables.accommodations.queries.fetchAccommodationById.fetchAccommodationById,
		() => (id ? { id: id as Id<'apartments'> } : 'skip')
	);
	const accommodation = $derived(accommodationQuery.data as Doc<'apartments'> | null | undefined);

	$effect(() => {
		siteHeaderBreadcrumb.lastLabel = accommodation?.title;
		return () => {
			siteHeaderBreadcrumb.lastLabel = undefined;
		};
	});
</script>

<SvelteHead
	title="Edit accommodation"
	description="Edit your accommodation accommodation."
	noIndex
/>

<section class="flex w-full flex-col gap-6 p-4 md:p-6">
	{#if accommodationQuery.error}
		<ErrorComponent
			variant="alert"
			title="Couldn't load this accommodation"
			description="Something went wrong while loading this accommodation. Please try again in a moment."
		/>
	{:else if accommodation === null}
		<EditAccommodationPageEmpty />
	{:else if accommodation === undefined}
		<EditAccommodationPageLoading />
	{:else}
		<EditAccommodationTabs {accommodation} />
	{/if}
</section>
