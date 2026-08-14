<script lang="ts">
	// PARAGLIDE
	import { m } from '@/lib/paraglide/messages';

	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useConvexClient } from 'convex-svelte';

	// COMPONENTS
	import ActionButton from '@/components/ui/action-button/action-button.svelte';
	import { Input } from '@/components/ui/input/index.js';
	import { NativeSelect } from '@/components/ui/select/index.js';

	// UTILS
	import { safeMutation } from '@/utils/convexHelpers';
	import { toastResult } from '@/utils/toastResult';

	/**
	 * Self-contained "Ban…" affordance: renders its own destructive trigger
	 * button, opens a confirm dialog with a reason input + expiry select via
	 * `ActionButton`'s `body` slot, and calls the `banUser` Convex mutation on
	 * confirm. Parent just drops `<BanUserDialog userId={…} userEmail={…} />`
	 * into the danger zone — no `bind:open` plumbing.
	 *
	 * The mutation owns the auth update + audit row atomically; this dialog is
	 * auth-provider-agnostic.
	 */
	let { userId, userEmail }: { userId: string; userEmail: string } = $props();

	const convex = useConvexClient();

	let reason = $state('');
	/** Seconds-from-now until ban lifts. Empty string = permanent. */
	let expiresIn = $state<string>('');
	let isPending = $state(false);

	async function confirm() {
		isPending = true;
		try {
			const expiresInSec = expiresIn === '' ? undefined : Number(expiresIn);
			const result = await safeMutation(convex, api.tables.users.userMutations.banUser, {
				userId,
				...(reason && { banReason: reason }),
				...(expiresInSec !== undefined && { banExpiresIn: expiresInSec })
			});
			if (!toastResult(result)) return;

			reason = '';
			expiresIn = '';
		} finally {
			isPending = false;
		}
	}
</script>

{#snippet banForm()}
	<div class="flex flex-col gap-3">
		<label class="flex flex-col gap-1 text-sm">
			<span>{m['AdminUsersPage.BanUserDialog.reasonLabel']()}</span>
			<Input bind:value={reason} placeholder={m['AdminUsersPage.BanUserDialog.reasonPlaceholder']()} disabled={isPending} />
		</label>

		<label class="flex flex-col gap-1 text-sm">
			<span>{m['AdminUsersPage.BanUserDialog.expiresLabel']()}</span>
			<NativeSelect
				bind:value={expiresIn}
				disabled={isPending}
				options={[
					{ value: '', label: m['AdminUsersPage.BanUserDialog.expiresPermanent']() },
					{ value: '86400', label: m['AdminUsersPage.BanUserDialog.expires1Day']() },
					{ value: '604800', label: m['AdminUsersPage.BanUserDialog.expires7Days']() },
					{ value: '2592000', label: m['AdminUsersPage.BanUserDialog.expires30Days']() }
				]}
			/>
		</label>
	</div>
{/snippet}

<ActionButton
	function={confirm}
	variant="destructive"
	{isPending}
	title={m['AdminUsersPage.BanUserDialog.title']({ userEmail })}
	description={m['AdminUsersPage.BanUserDialog.description']()}
	body={banForm}
>
	{m['AdminUsersPage.BanUserDialog.trigger']()}
</ActionButton>
