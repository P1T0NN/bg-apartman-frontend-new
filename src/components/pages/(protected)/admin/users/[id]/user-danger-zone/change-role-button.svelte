<script lang="ts">
	// PARAGLIDE
	import { m } from '@/paraglide/messages';

	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useConvexClient } from 'convex-svelte';

	// COMPONENTS
	import ActionButton from '@/components/ui/action-button/action-button.svelte';

	// UTILS
	import { safeMutation } from '@/utils/convexHelpers';
	import { toastResult } from '@/utils/toastResult';

	/**
	 * Admin-only promote/demote control for this app’s two-role model (`user` ↔ `admin`).
	 * Convex call, copy, and pending state stay in this file so the danger zone layout
	 * does not own mutation wiring for a single nested action.
	 */
	let {
		userId,
		userEmail,
		role
	}: {
		userId: string;
		userEmail: string;
		role: string;
	} = $props();

	const convex = useConvexClient();
	let isPending = $state(false);

	const demoting = $derived(role === 'admin');

	async function confirmRoleChange() {
		const nextRole = role === 'admin' ? 'user' : 'admin';
		isPending = true;
		try {
			const result = await safeMutation(convex, api.tables.users.userMutations.setUserRole, {
				userId,
				role: nextRole
			});
			toastResult(result);
		} finally {
			isPending = false;
		}
	}
</script>

<ActionButton
	function={confirmRoleChange}
	variant="outline"
	{isPending}
	title={demoting
		? m['AdminUsersPage.ChangeRoleButton.demoteTitle']({ userEmail })
		: m['AdminUsersPage.ChangeRoleButton.promoteTitle']({ userEmail })}
	description={demoting
		? m['AdminUsersPage.ChangeRoleButton.demoteDescription']()
		: m['AdminUsersPage.ChangeRoleButton.promoteDescription']()}
>
	{demoting ? m['AdminUsersPage.ChangeRoleButton.demote']() : m['AdminUsersPage.ChangeRoleButton.promote']()}
</ActionButton>
