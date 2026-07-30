<script lang="ts">
	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// LUCIDE ICONS
	import SearchXIcon from '@lucide/svelte/icons/search-x';
	import SearchIcon from '@lucide/svelte/icons/search';
</script>

<div
	class="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed px-6 py-16 text-center"
>
	<div class="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
		<SearchXIcon class="size-7" aria-hidden="true" />
	</div>

	<div class="flex flex-col gap-1.5">
		<h1 class="text-lg font-semibold">Reservation not found</h1>
		<p class="mx-auto max-w-sm text-sm text-muted-foreground">
			This reservation link is invalid or may have been removed. Check the link from your
			confirmation, or browse other stays.
		</p>
	</div>

	<Button href="/search" variant="outline">
		<SearchIcon class="size-4" aria-hidden="true" />
		Browse stays
	</Button>
</div>
