<script lang="ts">
	// LIBRARIES
	import { localizeHref } from '@/shared/lib/paraglide/runtime.js';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants.js';

	// COMPONENTS
	import * as Card from '@/shared/components/ui/card/index.js';
	import { Button } from '@/shared/components/ui/button/index.js';

	// LUCIDE ICONS
	import CompassIcon from '@lucide/svelte/icons/compass';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
</script>

<Card.Root class="flex flex-col items-center gap-3 p-10 text-center">
	<div class="grid size-12 place-items-center rounded-full bg-muted">
		<CompassIcon class="size-6 text-muted-foreground" aria-hidden="true" />
	</div>
    
	<div class="space-y-1">
		<h2 class="text-lg font-semibold">No trips yet</h2>
		<p class="text-sm text-muted-foreground">When you book a stay, it'll show up here.</p>
	</div>

	<Button href={localizeHref(UNPROTECTED_PAGE_ENDPOINTS.ROOT)} class="mt-2">
		Browse stays
		<ArrowRightIcon class="size-4" aria-hidden="true" />
	</Button>
</Card.Root>
