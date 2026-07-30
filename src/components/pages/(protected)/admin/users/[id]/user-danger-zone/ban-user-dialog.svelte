<script lang="ts">
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
			<span>Reason (optional)</span>
			<Input bind:value={reason} placeholder="Violation of terms…" disabled={isPending} />
		</label>

		<label class="flex flex-col gap-1 text-sm">
			<span>Expires</span>
			<NativeSelect
				bind:value={expiresIn}
				disabled={isPending}
				options={[
					{ value: '', label: 'Permanent' },
					{ value: '86400', label: '1 day' },
					{ value: '604800', label: '7 days' },
					{ value: '2592000', label: '30 days' }
				]}
			/>
		</label>
	</div>
{/snippet}

<ActionButton
	function={confirm}
	variant="destructive"
	{isPending}
	title={`Ban ${userEmail}`}
	description="The user is signed out and cannot sign in again until unbanned. The optional reason is shown on next sign-in attempt."
	body={banForm}
>
	Ban
</ActionButton>
