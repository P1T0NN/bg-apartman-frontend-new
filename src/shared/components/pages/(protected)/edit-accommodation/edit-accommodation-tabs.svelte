<script lang="ts">
	// LIBRARIES
	import { localizeHref } from '@/shared/lib/paraglide/runtime';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS, fillRoutePattern } from '@/shared/constants';

	// COMPONENTS
	import {
		TabComponent,
		type TabComponentContext,
		type TabComponentItem
	} from '@/shared/components/ui/tab-component/index.js';
	import { Button } from '@/shared/components/ui/button/index.js';
	import EditAccommodationInformation from './edit-accommodation-information-tab/edit-accommodation-information-tab.svelte';
	import EditAccommodationCalendar from './edit-accommodation-calendar-tab/edit-accommodation-calendar-tab.svelte';
	import EditAccommodationSettings from './edit-accommodation-settings-tab/edit-accommodation-settings-tab.svelte';

	// LUCIDE ICONS
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';

	// TYPES
	import type { Doc } from '@/convex/_generated/dataModel';

	let { accommodation }: { accommodation: Doc<'apartments'> } = $props();

	type EditAccommodationTab = 'information' | 'calendar' | 'settings';

	const editAccommodationTabs: readonly [
		TabComponentItem<EditAccommodationTab>,
		...TabComponentItem<EditAccommodationTab>[]
	] = [
		{ value: 'information', label: 'Information' },
		{ value: 'calendar', label: 'Calendar' },
		{ value: 'settings', label: 'Settings' }
	];

	const viewHref = $derived(
		localizeHref(
			fillRoutePattern(UNPROTECTED_PAGE_ENDPOINTS.ACCOMMODATION, { slug: accommodation.slug })
		)
	);
</script>

<div class="flex flex-col gap-6">
	<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
		<div class="min-w-0 space-y-1">
			<h1 class="truncate text-2xl font-semibold tracking-tight">{accommodation.title}</h1>
			<p class="text-sm text-muted-foreground">
				Edit your listing's details, availability and settings.
			</p>
		</div>
		<Button href={viewHref} variant="outline" target="_blank" rel="noopener" class="shrink-0">
			<ExternalLinkIcon class="size-4" aria-hidden="true" />
			View listing
		</Button>
	</div>

	<TabComponent tabs={editAccommodationTabs} queryKey="tab" defaultValue="information">
		{#snippet content({ value }: TabComponentContext<EditAccommodationTab>)}
			{#if value === 'information'}
				<!-- Remount on save: a successful update bumps `updatedAt`, useQuery re-de1livers
				     the doc, and the form re-seeds from the new images with `photos` cleared. -->
				{#key accommodation.updatedAt}
					<EditAccommodationInformation {accommodation} />
				{/key}
			{:else if value === 'calendar'}
				<EditAccommodationCalendar apartmentId={accommodation._id} timeZone={accommodation.timeZone} />
			{:else if value === 'settings'}
				<EditAccommodationSettings {accommodation} />
			{/if}
		{/snippet}
	</TabComponent>
</div>
