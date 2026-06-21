<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useConvexClient } from 'convex-svelte';
	import { m } from '@/shared/lib/paraglide/messages';

	// COMPONENTS
	import ActionButton from '@/shared/components/ui/action-button/action-button.svelte';
	import { Input } from '@/shared/components/ui/input/index.js';
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger
	} from '@/shared/components/ui/select/index.js';

	// UTILS
	import { safeMutation } from '@/shared/utils/convexHelpers';
	import { toastResult } from '@/shared/utils/toastResult';

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
			const result = await safeMutation(
				convex,
				api.tables.users.userMutations.banUser,
				{
					userId,
					...(reason && { banReason: reason }),
					...(expiresInSec !== undefined && { banExpiresIn: expiresInSec })
				}
			);
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
			<span>{m['AdminUserPage.BanUserDialog.reason']()}</span>
			<Input
				bind:value={reason}
				placeholder={m['AdminUserPage.BanUserDialog.reasonPlaceholder']()}
				disabled={isPending}
			/>
		</label>

		<label class="flex flex-col gap-1 text-sm">
			<span>{m['AdminUserPage.BanUserDialog.expires']()}</span>
			<Select
				type="single"
				value={expiresIn}
				onValueChange={(v) => (expiresIn = v)}
				disabled={isPending}
			>
				<SelectTrigger>
					<span>
						{#if expiresIn === ''}
							{m['AdminUserPage.BanUserDialog.permanent']()}
						{:else if expiresIn === '86400'}
							{m['AdminUserPage.BanUserDialog.oneDay']()}
						{:else if expiresIn === '604800'}
							{m['AdminUserPage.BanUserDialog.sevenDays']()}
						{:else if expiresIn === '2592000'}
							{m['AdminUserPage.BanUserDialog.thirtyDays']()}
						{/if}
					</span>
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="">{m['AdminUserPage.BanUserDialog.permanent']()}</SelectItem>
					<SelectItem value="86400">{m['AdminUserPage.BanUserDialog.oneDay']()}</SelectItem>
					<SelectItem value="604800">{m['AdminUserPage.BanUserDialog.sevenDays']()}</SelectItem>
					<SelectItem value="2592000">{m['AdminUserPage.BanUserDialog.thirtyDays']()}</SelectItem>
				</SelectContent>
			</Select>
		</label>
	</div>
{/snippet}

<ActionButton
	function={confirm}
	variant="destructive"
	{isPending}
	title={m['AdminUserPage.BanUserDialog.title']({ email: userEmail })}
	description={m['AdminUserPage.BanUserDialog.description']()}
	body={banForm}
>
	{m['AdminUserPage.BanUserDialog.ban']()}
</ActionButton>
