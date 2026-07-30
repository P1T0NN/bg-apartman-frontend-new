<script lang="ts">
	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/config/routeEndpoints';

	// COMPONENTS
	import {
		TabComponent,
		type TabComponentContext,
		type TabComponentItem
	} from '@/components/ui/tab-component/index.js';
	import { Button } from '@/components/ui/button/index.js';
	import EditAccommodationInformation from './edit-accommodation-information-tab/edit-accommodation-information-tab.svelte';
	import EditAccommodationSettings from './edit-accommodation-settings-tab/edit-accommodation-settings-tab.svelte';

	// UTILS
	import { appGoto } from '@/utils/app-navigation';

	// TYPES
	import type { Doc } from '@/convex/_generated/dataModel';

	// LUCIDE ICONS
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';

	let { accommodation }: { accommodation: Doc<'apartments'> } = $props();

	type EditAccommodationTab = 'information' | 'settings';

	// Availability lives on its own route, entered from the my-accommodations row
	// (HostSystemDesign.md §4) — one home for the calendar, not a second copy in here.
	const editAccommodationTabs: readonly [
		TabComponentItem<EditAccommodationTab>,
		...TabComponentItem<EditAccommodationTab>[]
	] = [
		{ value: 'information', label: 'Information' },
		{ value: 'settings', label: 'Settings' }
	];
</script>

<div class="flex flex-col gap-6">
	<header class="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-end sm:justify-between">
		<div class="min-w-0 space-y-1">
			<h1 class="truncate text-2xl font-semibold tracking-tight md:text-3xl">
				{accommodation.title}
			</h1>
			<p class="max-w-2xl text-sm leading-relaxed text-muted-foreground">
				Edit your accommodation's details, availability and settings.
			</p>
		</div>

		<Button
			onclick={() =>
				appGoto(UNPROTECTED_PAGE_ENDPOINTS.ACCOMMODATION.replace(':slug', accommodation.slug))}
			variant="outline"
			target="_blank"
			rel="noopener"
			class="w-full shrink-0 sm:w-auto"
		>
			<ExternalLinkIcon class="size-4" aria-hidden="true" />
			View accommodation
		</Button>
	</header>

	<TabComponent tabs={editAccommodationTabs} queryKey="tab" defaultValue="information">
		{#snippet content({ value }: TabComponentContext<EditAccommodationTab>)}
			{#if value === 'information'}
				<!-- Remount on save: a successful update bumps `updatedAt`, useQuery re-de1livers
				     the doc, and the form re-seeds from the new images with `photos` cleared. -->
				{#key accommodation.updatedAt}
					<EditAccommodationInformation {accommodation} />
				{/key}
			{:else if value === 'settings'}
				<EditAccommodationSettings {accommodation} />
			{/if}
		{/snippet}
	</TabComponent>
</div>
