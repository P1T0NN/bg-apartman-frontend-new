<script lang="ts">
	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/routeEndpoints';

	// COMPONENTS
	import { QualityImage } from '@/shared/components/ui/quality-image';
	import { Button } from '@/shared/components/ui/button/index.js';
	import AccommodationCardBody from '@/features/accommodations/components/accommodation-card/accommodation-card-body.svelte';

	// UTILS
	import { appHref } from '@/utils/app-navigation.js';

	// TYPES
	import type { SearchAccommodation } from '@/shared/features/accommodation/types/accommodationTypes';
	import type { Id } from '@/convex/_generated/dataModel';
	import type { GoogleMapHandle } from '@/shared/components/ui/google-map/types';

	// LUCIDE ICONS
	import XIcon from '@lucide/svelte/icons/x';

	let {
		selected,
		selectedId = $bindable(),
		mapHandle
	}: {
		selected: SearchAccommodation;
		selectedId: Id<'apartments'> | null;
		mapHandle?: GoogleMapHandle;
	} = $props();

	function clearMapSelection() {
		selectedId = null;
		mapHandle?.setSelected(null);
	}
</script>

<div class="pointer-events-none absolute inset-x-0 bottom-24 flex justify-center px-4 lg:bottom-6">
	<div
		class="pointer-events-auto relative w-full max-w-md rounded-2xl border bg-background p-3 shadow-xl"
	>
		<button
			type="button"
			aria-label="Close"
			onclick={clearMapSelection}
			class="absolute -top-2 -right-2 z-10 grid size-7 place-items-center rounded-full bg-background shadow-md"
		>
			<XIcon class="size-4" aria-hidden="true" />
		</button>

		<div class="flex gap-3">
			<div class="relative aspect-4/3 w-28 shrink-0 overflow-hidden rounded-xl bg-muted sm:w-32">
				<QualityImage
					src={selected.image.url}
					alt={selected.image.alt ?? selected.title}
					class="h-full w-full object-cover"
				/>
			</div>

			<div class="flex min-w-0 flex-1 flex-col">
				<AccommodationCardBody accommodation={selected}>
					{#snippet actions()}
						<Button
							href={appHref(
								UNPROTECTED_PAGE_ENDPOINTS.ACCOMMODATION.replace(':slug', selected.slug)
							)}
							size="sm">View</Button
						>
					{/snippet}
				</AccommodationCardBody>
			</div>
		</div>
	</div>
</div>
