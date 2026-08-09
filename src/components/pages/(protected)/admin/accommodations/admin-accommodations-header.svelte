<script lang="ts">
	// CONFIG
	import { ADMIN_PAGE_ENDPOINTS } from '@/config/routeEndpoints';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// LUCIDE ICONS
	import PlusIcon from '@lucide/svelte/icons/plus';
</script>

<header class="flex items-start justify-between gap-4">
	<div class="flex flex-col gap-1">
		<h1 class="text-2xl font-semibold tracking-tight">Accommodations</h1>
		<p class="text-sm text-muted-foreground">
			Which listings need review, and what is live on the platform.
		</p>
	</div>

	<Button href={ADMIN_PAGE_ENDPOINTS.ADD_ACCOMMODATION}>
		<PlusIcon class="size-4" />
		Add accommodation
	</Button>
</header>
