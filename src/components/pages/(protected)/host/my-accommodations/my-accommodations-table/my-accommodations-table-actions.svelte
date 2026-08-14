<script lang="ts">
	// I18N
	import { m } from '@/paraglide/messages';

	// CONFIG
	import { PROTECTED_PAGE_ENDPOINTS, UNPROTECTED_PAGE_ENDPOINTS } from '@/config/routeEndpoints';
	import { PAYMENTS_CONFIG } from '@/shared/config';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import MyAccommodationsTableChangePlan from './my-accommodations-table-change-plan.svelte';

	// UTILS
	import { appGoto } from '@/utils/app-navigation';
	import { listingIsListingFee } from '@/shared/features/accommodation/utils/listingFeeState';

	// TYPES
	import type { typesAccommodation } from '@/shared/features/accommodation/types/accommodationTypes';

	// LUCIDE ICONS
	import EyeIcon from '@lucide/svelte/icons/eye';
	import SquarePenIcon from '@lucide/svelte/icons/square-pen';
	import CalendarIcon from '@lucide/svelte/icons/calendar';

	let { row }: { row: typesAccommodation } = $props();

	// One-way door (ASD §8): only listing_fee rows can change plan, and only once the
	// provider is live — the switch makes the listing online-only in the same click.
	const canChangePlan = $derived(listingIsListingFee(row) && PAYMENTS_CONFIG.PROVIDER !== 'none');
</script>

<div class="flex items-center justify-end gap-1">
	{#if canChangePlan}
		<MyAccommodationsTableChangePlan {row} />
	{/if}
	<Button
		onclick={() => appGoto(UNPROTECTED_PAGE_ENDPOINTS.ACCOMMODATION.replace(':slug', row.slug))}
		variant="ghost"
		size="icon-sm"
		aria-label={m['HostMyAccommodationsPage.MyAccommodationsTableActions.viewAccommodation']()}
		title={m['HostMyAccommodationsPage.MyAccommodationsTableActions.view']()}
	>
		<EyeIcon class="size-4" aria-hidden="true" />
	</Button>

	<!-- The calendar's only entry point (HostSystemDesign.md §4) — per listing, no sidebar item. -->
	<Button
		onclick={() => appGoto(PROTECTED_PAGE_ENDPOINTS.ACCOMMODATION_CALENDAR.replace(':id', row._id))}
		variant="ghost"
		size="icon-sm"
		aria-label={m['HostMyAccommodationsPage.MyAccommodationsTableActions.openCalendar']()}
		title={m['HostMyAccommodationsPage.MyAccommodationsTableActions.calendar']()}
	>
		<CalendarIcon class="size-4" aria-hidden="true" />
	</Button>

	<Button
		onclick={() => appGoto(PROTECTED_PAGE_ENDPOINTS.EDIT_ACCOMMODATION.replace(':id', row._id))}
		variant="ghost"
		size="icon-sm"
		aria-label={m['HostMyAccommodationsPage.MyAccommodationsTableActions.editAccommodation']()}
		title={m['HostMyAccommodationsPage.MyAccommodationsTableActions.edit']()}
	>
		<SquarePenIcon class="size-4" aria-hidden="true" />
	</Button>
</div>
