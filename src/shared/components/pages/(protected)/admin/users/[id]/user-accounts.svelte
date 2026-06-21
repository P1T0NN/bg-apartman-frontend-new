<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useQuery } from 'convex-svelte';

	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';

	// COMPONENTS
	import { Skeleton } from '@/shared/components/ui/skeleton/index.js';

	// UTILS
	import { capitalizeFirst } from '@/shared/utils/stringUtils';
	import { formatTs } from '@/shared/utils/dateUtils';

	/**
	 * Row shape returned by `listUserAccounts` (BA component `account` table, shaped
	 * by the query). Sensitive fields (tokens, password hash) are not exposed —
	 * `hasPassword` is the only boolean we get for credential accounts.
	 */
	type AccountRow = {
		_id: string;
		accountId: string;
		providerId: string;
		createdAt: number | string;
		updatedAt: number | string;
		hasPassword: boolean;
		scope: string | null;
	};

	let { userId }: { userId: string } = $props();

	const accountsQuery = useQuery(api.tables.users.userQueries.listUserAccounts, () => ({ userId }));
	const accounts = $derived((accountsQuery.data ?? []) as AccountRow[]);
</script>

<div class="flex flex-col gap-4">
	<header class="flex flex-col gap-0.5">
		<h2 class="text-base font-semibold">{m['AdminUserPage.UserAccounts.title']()}</h2>
		<p class="text-sm text-muted-foreground">
			{m['AdminUserPage.UserAccounts.description']()}
		</p>
	</header>

	{#if accountsQuery.error}
		<p class="text-sm text-destructive">{m['AdminUserPage.UserAccounts.failedLoad']()}</p>
	{:else if accountsQuery.data === undefined}
		<div class="flex flex-col gap-2">
			<Skeleton class="h-16 w-full" />
			<Skeleton class="h-16 w-full" />
		</div>
	{:else if accounts.length === 0}
		<p class="text-sm text-muted-foreground">{m['AdminUserPage.UserAccounts.noAccounts']()}</p>
	{:else}
		<ul class="flex flex-col gap-2">
			{#each accounts as account (account._id)}
				<li class="flex flex-col gap-1 rounded-md border p-3">
					<div class="flex flex-wrap items-center gap-2">
						<span class="text-sm font-medium">{capitalizeFirst(account.providerId)}</span>
						{#if account.providerId === 'credential'}
							<span class="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
								{account.hasPassword
									? m['AdminUserPage.UserAccounts.passwordSet']()
									: m['AdminUserPage.UserAccounts.noPassword']()}
							</span>
						{/if}
					</div>

					<div class="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
						<span class="break-all"
							>{m['AdminUserPage.UserAccounts.id']()}: {account.accountId}</span
						>
						<span>{m['AdminUserPage.UserAccounts.created']()}: {formatTs(account.createdAt)}</span>
						{#if account.scope}
							<span class="break-all"
								>{m['AdminUserPage.UserAccounts.scope']()}: {account.scope}</span
							>
						{/if}
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>
