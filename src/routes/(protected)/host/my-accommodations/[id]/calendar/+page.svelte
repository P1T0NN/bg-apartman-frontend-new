<script lang="ts">
	// I18N
	import { m } from '@/lib/paraglide/messages';

	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useQuery } from 'convex-svelte';
	import { page } from '$app/state';

	// CONFIG
	import { PROTECTED_PAGE_ENDPOINTS } from '@/config/routeEndpoints';

	// UTILS
	import { appHref } from '@/utils/app-navigation.js';

	// CLASSES
	import { siteHeaderBreadcrumb } from '@/components/ui/app-sidebar/site-header-breadcrumb.svelte.js';

	// COMPONENTS
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import { Button } from '@/components/ui/button/index.js';
	import ApartmentCalendar from '@/components/pages/(protected)/host/calendar/apartment-calendar.svelte';
	import EditAccommodationPageLoading from '@/components/pages/(protected)/host/edit-accommodation/loading/edit-accommodation-page-loading.svelte';
	import EditAccommodationPageEmpty from '@/components/pages/(protected)/host/edit-accommodation/empty/edit-accommodation-page-empty.svelte';
	import { ErrorComponent } from '@/components/ui/error-component/index.js';

	// TYPES
	import type { Doc, Id } from '@/convex/_generated/dataModel';

	// LUCIDE ICONS
	import CalendarCheckIcon from '@lucide/svelte/icons/calendar-check';

	// `params.id` is `string | undefined` at the type level; on `[id]` it always exists at
	// runtime, and `'skip'` while missing avoids a bad request.
	const id = $derived(page.params.id);

	// The listing doc only supplies the title + time zone the grid runs in; the calendar's own
	// subscription (HostSystemDesign.md §2) carries the nights.
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
	title={m['HostCalendarPage.SEO.title']()}
	description={m['HostCalendarPage.SEO.description']()}
	noIndex
/>

<section class="flex w-full flex-col gap-6 p-4 md:p-6">
	{#if accommodationQuery.error}
		<ErrorComponent
			variant="alert"
			title={m['HostCalendarPage.loadErrorTitle']()}
			description={m['HostCalendarPage.loadErrorDescription']()}
		/>
	{:else if accommodation === null}
		<EditAccommodationPageEmpty />
	{:else if accommodation === undefined}
		<EditAccommodationPageLoading />
	{:else}
		<header class="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-end sm:justify-between">
			<div class="min-w-0 space-y-1">
				<h1 class="truncate text-2xl font-semibold tracking-tight md:text-3xl">
					{accommodation.title}
				</h1>
				<p class="max-w-2xl text-sm leading-relaxed text-muted-foreground">
					{m['HostCalendarPage.blockDatesHint']()}
				</p>
			</div>

			<!-- Booked nights are read-only cells; the queue is where a stay is acted on
			     (HostSystemDesign.md §4). -->
			<Button
				href={`${appHref(PROTECTED_PAGE_ENDPOINTS.RESERVATIONS)}?status=confirmed`}
				variant="outline"
				class="w-full shrink-0 sm:w-auto"
			>
				<CalendarCheckIcon class="size-4" aria-hidden="true" />
				{m['HostCalendarPage.viewReservations']()}
			</Button>
		</header>

		<ApartmentCalendar apartmentId={accommodation._id} timeZone={accommodation.timeZone} />
	{/if}
</section>
