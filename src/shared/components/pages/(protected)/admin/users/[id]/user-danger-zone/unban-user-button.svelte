<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useConvexClient } from 'convex-svelte';
	import { m } from '@/shared/lib/paraglide/messages';

	// COMPONENTS
	import { Button } from '@/shared/components/ui/button/index.js';

	// UTILS
	import { safeMutation } from '@/shared/utils/convexHelpers';
	import { toastResult } from '@/shared/utils/toastResult';

	/**
	 * Self-contained "Unban" button. Calls the `unbanUser` Convex mutation. No
	 * confirm dialog — unbanning is the reversible side of the ban/unban pair,
	 * so single-click is fine.
	 */
	let { userId }: { userId: string } = $props();

	const convex = useConvexClient();
	let isPending = $state(false);

	async function unban() {
		isPending = true;
		try {
			const result = await safeMutation(
				convex,
				api.tables.users.userMutations.unbanUser,
				{ userId }
			);
			toastResult(result);
		} finally {
			isPending = false;
		}
	}
</script>

<Button variant="outline" onclick={unban} disabled={isPending}>{m['AdminUserPage.UnbanUserButton.unban']()}</Button>
