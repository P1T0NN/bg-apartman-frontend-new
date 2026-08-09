<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useConvexClient } from 'convex-svelte';

	// COMPONENTS
	import ActionButton from '@/components/ui/action-button/action-button.svelte';

	// UTILS
	import { safeMutation } from '@/utils/convexHelpers';
	import { toastResult } from '@/utils/toastResult';

	/**
	 * Grant / revoke the superhost badge — the only writer of the flag anywhere in the app.
	 * Mutation wiring stays in this file, same as `change-role-button.svelte`.
	 */
	let {
		userId,
		userEmail,
		isSuperhost
	}: {
		userId: string;
		userEmail: string;
		isSuperhost: boolean;
	} = $props();

	const convex = useConvexClient();
	let isPending = $state(false);

	async function confirmSuperhostChange() {
		isPending = true;
		try {
			const result = await safeMutation(convex, api.tables.users.userMutations.setUserSuperhost, {
				userId,
				isSuperhost: !isSuperhost
			});
			toastResult(result);
		} finally {
			isPending = false;
		}
	}
</script>

<ActionButton
	function={confirmSuperhostChange}
	variant="outline"
	{isPending}
	title={isSuperhost ? `Remove superhost from ${userEmail}?` : `Make ${userEmail} a superhost?`}
	description={isSuperhost
		? 'The badge disappears from every listing they own. Their listings update in the background, so it can take a moment on a large portfolio.'
		: 'The badge appears on every listing they own, and on any listing they add later. Their listings update in the background, so it can take a moment on a large portfolio.'}
>
	{isSuperhost ? 'Remove superhost' : 'Make superhost'}
</ActionButton>
