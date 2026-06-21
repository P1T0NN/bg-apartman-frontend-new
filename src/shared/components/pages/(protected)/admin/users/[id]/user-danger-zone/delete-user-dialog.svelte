<script lang="ts">
	// SVELTEKIT IMPORTS
	import { goto } from '$app/navigation';

	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useConvexClient } from 'convex-svelte';
	import { m } from '@/shared/lib/paraglide/messages';
	import { localizeHref } from '@/shared/lib/paraglide/runtime';

	// COMPONENTS
	import ActionButton from '@/shared/components/ui/action-button/action-button.svelte';
	import { Input } from '@/shared/components/ui/input/index.js';

	// UTILS
	import { safeMutation } from '@/shared/utils/convexHelpers';
	import { toastResult } from '@/shared/utils/toastResult';

	/**
	 * Self-contained "Delete…" affordance. Renders its own destructive trigger,
	 * gates the confirm action behind a typed-email match (via `ActionButton`'s
	 * `actionDisabled` prop), and calls the `deleteUser` Convex mutation on
	 * confirm. Navigates to `redirectUrl` after success.
	 *
	 * Admin users get a different dialog: title, description, no confirm input,
	 * and the proceed button is hidden — there's nothing the admin viewing the
	 * dialog can do without first demoting the target. The server enforces the
	 * same rule independently (`ADMIN_CANNOT_BE_DELETED` soft failure) as
	 * defense in depth — any caller bypassing this UI still hits the wall.
	 */
	let {
		userId,
		userEmail,
		redirectUrl,
		role
	}: {
		userId: string;
		userEmail: string;
		redirectUrl?: string;
		role: string;
	} = $props();

	const convex = useConvexClient();

	let typedConfirm = $state('');
	let isPending = $state(false);

	async function confirm() {
		if (role === 'admin' || typedConfirm !== userEmail) return;
		isPending = true;
		try {
			const result = await safeMutation(
				convex,
				api.tables.users.userMutations.deleteUser,
				{ userId }
			);
			if (!toastResult(result)) return;

			typedConfirm = '';
			if (redirectUrl) await goto(localizeHref(redirectUrl));
		} finally {
			isPending = false;
		}
	}
</script>

{#snippet deleteForm()}
	{#if role !== 'admin'}
		<Input bind:value={typedConfirm} placeholder={userEmail} disabled={isPending} />
	{/if}
{/snippet}

<ActionButton
	function={confirm}
	variant={role === 'admin' ? 'outline' : 'destructive'}
	{isPending}
	actionDisabled={role === 'admin' || typedConfirm !== userEmail}
	isDestructive={role !== 'admin'}
	hideProceed={role === 'admin'}
	title={role === 'admin'
		? m['AdminUserPage.DeleteUserDialog.adminTitle']({ email: userEmail })
		: m['AdminUserPage.DeleteUserDialog.title']({ email: userEmail })}
	description={role === 'admin'
		? m['AdminUserPage.DeleteUserDialog.adminDescription']()
		: m['AdminUserPage.DeleteUserDialog.description']()}
	body={role !== 'admin' ? deleteForm : undefined}
>
	{m['AdminUserPage.DeleteUserDialog.delete']()}
</ActionButton>
