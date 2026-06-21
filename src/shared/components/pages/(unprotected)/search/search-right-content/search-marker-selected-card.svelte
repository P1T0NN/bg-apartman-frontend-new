<script lang="ts">
    // COMPONENTS
    import { QualityImage } from '@/shared/components/ui/quality-image';
    import { Button } from '@/shared/components/ui/button/index.js';

    // UTILS
    import { formatCurrency, accommodationTypeLabel } from '@/features/accommodations/utils/accommodationPresentation';

	// TYPES
	import type { SearchListing } from '@/features/accommodations/data/searchResultsDummyData';
	import type { Id } from '@/convex/_generated/dataModel';
	import type { GoogleMapHandle } from '@/shared/components/ui/google-map/types';

    // LUCIDE ICONS
    import XIcon from '@lucide/svelte/icons/x';
    import StarIcon from '@lucide/svelte/icons/star';

	let { 
		selected, 
		selectedId = $bindable(),
		mapHandle,
	}: { 
		selected: SearchListing; 
		selectedId: Id<'apartments'> | null;
		mapHandle?: GoogleMapHandle;
	} = $props();

	function clearMapSelection() {
		selectedId = null;
		mapHandle?.setSelected(null);
	}
</script>

<div
    class="pointer-events-none absolute inset-x-0 bottom-24 flex justify-center px-4 lg:bottom-6"
>
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
            <div
                class="relative aspect-4/3 w-28 shrink-0 overflow-hidden rounded-xl bg-muted sm:w-32"
            >
                <QualityImage
                    src={selected.image.url}
                    alt={selected.image.alt ?? selected.title}
                    class="h-full w-full object-cover"
                />
            </div>

            <div class="flex min-w-0 flex-1 flex-col">
                <div class="flex items-start justify-between gap-2">
                    <h3 class="truncate text-sm font-medium">{selected.title}</h3>
                    <span class="flex shrink-0 items-center gap-1 text-sm">
                        <StarIcon class="size-3.5 fill-current" aria-hidden="true" />
                        {selected.rating.toFixed(2)}
                    </span>
                </div>

                <p class="truncate text-sm text-muted-foreground">
                    {accommodationTypeLabel(selected.type)} in {selected.city} · {selected.maxGuests}
                    guests
                </p>

                <div class="mt-auto flex items-end justify-between gap-2 pt-2">
                    <p class="text-sm">
                        {#if selected.originalPrice}
                            <span class="text-muted-foreground line-through"
                                >{formatCurrency(selected.originalPrice)}</span
                            >
                        {/if}
                        <span class="font-semibold">{formatCurrency(selected.pricePerNight)}</span>
                        <span class="text-muted-foreground">/ night</span>
                    </p>

                    <Button href={`/accommodation/${selected.slug}`} size="sm">View</Button>
                </div>
            </div>
        </div>
    </div>
</div>
