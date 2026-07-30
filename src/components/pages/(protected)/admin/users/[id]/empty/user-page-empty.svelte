<script lang="ts">
	// LIBRARIES
	import { goto } from '$app/navigation';
	import UserXIcon from '@lucide/svelte/icons/user-x';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
</script>

<div
	class="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed px-6 py-16 text-center"
>
	<div class="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
		<UserXIcon class="size-6" />
	</div>

	<div class="flex flex-col gap-1">
		<h2 class="text-lg font-semibold">User not found</h2>
		<p class="max-w-sm text-sm text-muted-foreground">
			The user you're looking for doesn't exist or may have been deleted.
		</p>
	</div>

	<Button variant="outline" size="sm" onclick={() => goto('/admin/users')}>
		<ArrowLeftIcon class="size-4" />
		Back to users
	</Button>
</div>
