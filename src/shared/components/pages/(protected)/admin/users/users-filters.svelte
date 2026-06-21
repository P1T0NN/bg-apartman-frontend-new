<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';

	// COMPONENTS
	import { Button } from '@/shared/components/ui/button/index.js';
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger
	} from '@/shared/components/ui/select/index.js';

	// UTILS
	import { capitalizeFirst } from '@/shared/utils/stringUtils';

	/**
	 * Filter bar for `/admin/users`. Lives outside the route file so the page can
	 * stay focused on data flow (queryArgs, mutations, dialogs).
	 *
	 * State is bindable — the page owns the values so it can derive `queryArgs`
	 * for the DataTable. Each prop maps 1:1 to a `listUsers` arg.
	 */
	let {
		searchField = $bindable<'email' | 'name'>('email'),
		role = $bindable<'user' | 'admin' | undefined>(undefined),
		banned = $bindable<boolean | undefined>(undefined),
		emailVerified = $bindable<boolean | undefined>(undefined)
	}: {
		searchField?: 'email' | 'name';
		role?: 'user' | 'admin' | undefined;
		banned?: boolean | undefined;
		emailVerified?: boolean | undefined;
	} = $props();

	const hasActiveFilter = $derived(
		role !== undefined || banned !== undefined || emailVerified !== undefined
	);

	function clearFilters() {
		role = undefined;
		banned = undefined;
		emailVerified = undefined;
	}
</script>

<Select
	type="single"
	value={searchField}
	onValueChange={(v) => (searchField = (v as 'email' | 'name') || 'email')}
>
	<SelectTrigger class="w-36">
		<span>
			{m['AdminUsersPage.UsersFilters.searchLabel']({ field: capitalizeFirst(searchField) })}
		</span>
	</SelectTrigger>
	<SelectContent>
		<SelectItem value="email">{m['AdminUsersPage.UsersFilters.searchEmail']()}</SelectItem>
		<SelectItem value="name">{m['AdminUsersPage.UsersFilters.searchName']()}</SelectItem>
	</SelectContent>
</Select>

<Select
	type="single"
	value={role ?? ''}
	onValueChange={(v) => (role = v === '' ? undefined : (v as 'user' | 'admin'))}
>
	<SelectTrigger class="w-32">
		<span>
			{#if role}
				{m['AdminUsersPage.UsersFilters.roleLabel']({ role: capitalizeFirst(role) })}
			{:else}
				{m['AdminUsersPage.UsersFilters.anyRole']()}
			{/if}
		</span>
	</SelectTrigger>
	<SelectContent>
		<SelectItem value="">{m['AdminUsersPage.UsersFilters.anyRole']()}</SelectItem>
		<SelectItem value="user">{m['AdminUsersPage.UsersFilters.roleUser']()}</SelectItem>
		<SelectItem value="admin">{m['AdminUsersPage.UsersFilters.roleAdmin']()}</SelectItem>
	</SelectContent>
</Select>

<Select
	type="single"
	value={banned === undefined ? '' : String(banned)}
	onValueChange={(v) => (banned = v === '' ? undefined : v === 'true')}
>
	<SelectTrigger class="w-36">
		<span>
			{#if banned === undefined}
				{m['AdminUsersPage.UsersFilters.anyStatus']()}
			{:else if banned}
				{m['AdminUsersPage.UsersFilters.statusBanned']()}
			{:else}
				{m['AdminUsersPage.UsersFilters.statusActive']()}
			{/if}
		</span>
	</SelectTrigger>
	<SelectContent>
		<SelectItem value="">{m['AdminUsersPage.UsersFilters.anyStatus']()}</SelectItem>
		<SelectItem value="true">{m['AdminUsersPage.UsersFilters.statusBanned']()}</SelectItem>
		<SelectItem value="false">{m['AdminUsersPage.UsersFilters.statusActive']()}</SelectItem>
	</SelectContent>
</Select>

<Select
	type="single"
	value={emailVerified === undefined ? '' : String(emailVerified)}
	onValueChange={(v) => (emailVerified = v === '' ? undefined : v === 'true')}
>
	<SelectTrigger class="w-44">
		<span>
			{#if emailVerified === undefined}
				{m['AdminUsersPage.UsersFilters.anyVerification']()}
			{:else if emailVerified}
				{m['AdminUsersPage.UsersFilters.verified']()}
			{:else}
				{m['AdminUsersPage.UsersFilters.unverified']()}
			{/if}
		</span>
	</SelectTrigger>
	<SelectContent>
		<SelectItem value="">{m['AdminUsersPage.UsersFilters.anyVerification']()}</SelectItem>
		<SelectItem value="true">{m['AdminUsersPage.UsersFilters.verified']()}</SelectItem>
		<SelectItem value="false">{m['AdminUsersPage.UsersFilters.unverified']()}</SelectItem>
	</SelectContent>
</Select>

{#if hasActiveFilter}
	<Button variant="ghost" size="sm" onclick={clearFilters}>
		{m['AdminUsersPage.UsersFilters.clear']()}
	</Button>
{/if}
