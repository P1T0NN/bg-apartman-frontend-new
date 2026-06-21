<script lang="ts">
	// LIBRARIES
	import { invalidateAll } from '$app/navigation';
	import { m } from '@/shared/lib/paraglide/messages';
	import AlertTriangleIcon from '@lucide/svelte/icons/triangle-alert';
	import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';

	// COMPONENTS
	import { Button } from '@/shared/components/ui/button/index.js';

	let { message }: { message?: string } = $props();
</script>

<div class="border-destructive/30 bg-destructive/5 flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed py-16 px-6 text-center">
	<div class="bg-destructive/10 text-destructive flex size-12 items-center justify-center rounded-full">
		<AlertTriangleIcon class="size-6" />
	</div>

	<div class="flex flex-col gap-1">
		<h2 class="text-lg font-semibold">{m['AdminUserPage.UserPageError.title']()}</h2>
		<p class="text-muted-foreground max-w-sm text-sm">
			{message ?? m['AdminUserPage.UserPageError.description']()}
		</p>
	</div>

	<Button variant="outline" size="sm" onclick={() => invalidateAll()}>
		<RefreshCwIcon class="size-4" />
		{m['AdminUserPage.UserPageError.retry']()}
	</Button>
</div>
