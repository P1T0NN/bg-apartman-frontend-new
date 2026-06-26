<script lang="ts">
    // LIBRARIES
    import { m } from '@/shared/lib/paraglide/messages';
    
    // COMPONENTS
    import { Button } from '@/shared/components/ui/button/index.js';

    // TYPES
    import type { typesAccommodationImage } from '@/features/accommodations/types/types';

    // LUCIDE ICONS
    import XIcon from '@lucide/svelte/icons/x';

    let {
        images,
        title,
        lightboxOpen = $bindable()
    }: {
        images: typesAccommodationImage[];
        title: string;
        lightboxOpen: boolean;
    } = $props();
</script>

<div
    class="fixed inset-0 z-100 flex flex-col bg-background"
    role="dialog"
    aria-modal="true"
    aria-label={m['AccommodationPage.AccommodationGalleryLightbox.ariaLabel']({ title })}
>
    <div class="sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur">
        <Button 
            variant="ghost" 
            size="icon-sm" 
            onclick={() => (lightboxOpen = false)} 
            aria-label={m['AccommodationPage.AccommodationGalleryLightbox.closeGallery']()}
        >
            <XIcon />
        </Button>

        <p class="text-sm font-medium">{title}</p>
        
        <span class="w-7"></span>
    </div>

    <div class="flex-1 overflow-y-auto">
        <div class="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-6">
            {#each images as image (image.key)}
                <figure class="space-y-1.5">
                    <img
                        src={image.url}
                        alt={image.alt ?? title}
                        class="w-full rounded-xl object-cover"
                        loading="lazy"
                    />

                    {#if image.alt}
                        <figcaption class="text-center text-xs text-muted-foreground">{image.alt}</figcaption>
                    {/if}
                </figure>
            {/each}
        </div>
    </div>
</div>