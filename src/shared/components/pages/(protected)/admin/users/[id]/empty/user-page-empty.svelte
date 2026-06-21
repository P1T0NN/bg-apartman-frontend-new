<script lang="ts">
	// LIBRARIES
	import { goto } from '$app/navigation';
	import { localizeHref } from '@/shared/lib/paraglide/runtime';
	import { m } from '@/shared/lib/paraglide/messages';
	import UserXIcon from '@lucide/svelte/icons/user-x';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';

	// COMPONENTS
	import { Button } from '@/shared/components/ui/button/index.js';
</script>

<div class="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed py-16 px-6 text-center">
	<div class="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-full">
		<UserXIcon class="size-6" />
	</div>

	<div class="flex flex-col gap-1">
		<h2 class="text-lg font-semibold">{m['AdminUserPage.UserPageEmpty.title']()}</h2>
		<p class="text-muted-foreground max-w-sm text-sm">
			{m['AdminUserPage.UserPageEmpty.description']()}
		</p>
	</div>

	<Button variant="outline" size="sm" onclick={() => goto(localizeHref('/admin/users'))}>
		<ArrowLeftIcon class="size-4" />
		{m['AdminUserPage.UserPageEmpty.backToUsers']()}
	</Button>
</div>
