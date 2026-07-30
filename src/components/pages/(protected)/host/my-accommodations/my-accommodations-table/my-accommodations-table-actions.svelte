<script lang="ts">
	// CONFIG
	import { PROTECTED_PAGE_ENDPOINTS, UNPROTECTED_PAGE_ENDPOINTS } from '@/config/routeEndpoints';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// UTILS
	import { appGoto } from '@/utils/app-navigation';

	// TYPES
	import type { typesAccommodation } from '@/shared/features/accommodation/types/accommodationTypes';

	// LUCIDE ICONS
	import EyeIcon from '@lucide/svelte/icons/eye';
	import SquarePenIcon from '@lucide/svelte/icons/square-pen';
	import CalendarIcon from '@lucide/svelte/icons/calendar';

	let { row }: { row: typesAccommodation } = $props();
</script>

<div class="flex items-center justify-end gap-1">
	<Button
		onclick={() => appGoto(UNPROTECTED_PAGE_ENDPOINTS.ACCOMMODATION.replace(':slug', row.slug))}
		variant="ghost"
		size="icon-sm"
		aria-label="View accommodation"
		title="View"
	>
		<EyeIcon class="size-4" aria-hidden="true" />
	</Button>

	<!-- The calendar's only entry point (HostSystemDesign.md §4) — per listing, no sidebar item. -->
	<Button
		onclick={() => appGoto(PROTECTED_PAGE_ENDPOINTS.ACCOMMODATION_CALENDAR.replace(':id', row._id))}
		variant="ghost"
		size="icon-sm"
		aria-label="Open calendar"
		title="Calendar"
	>
		<CalendarIcon class="size-4" aria-hidden="true" />
	</Button>

	<Button
		onclick={() => appGoto(PROTECTED_PAGE_ENDPOINTS.EDIT_ACCOMMODATION.replace(':id', row._id))}
		variant="ghost"
		size="icon-sm"
		aria-label="Edit accommodation"
		title="Edit"
	>
		<SquarePenIcon class="size-4" aria-hidden="true" />
	</Button>
</div>
