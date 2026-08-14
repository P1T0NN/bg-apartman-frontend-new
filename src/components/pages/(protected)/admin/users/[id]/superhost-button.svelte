<script lang="ts">
	// PARAGLIDE
	import { m } from '@/lib/paraglide/messages';

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
	title={isSuperhost
		? m['AdminUsersPage.SuperhostButton.removeSuperhostTitle']({ userEmail })
		: m['AdminUsersPage.SuperhostButton.makeSuperhostTitle']({ userEmail })}
	description={isSuperhost
		? m['AdminUsersPage.SuperhostButton.removeSuperhostDescription']()
		: m['AdminUsersPage.SuperhostButton.makeSuperhostDescription']()}
>
	{isSuperhost ? m['AdminUsersPage.SuperhostButton.removeSuperhost']() : m['AdminUsersPage.SuperhostButton.makeSuperhost']()}
</ActionButton>
