<script lang="ts">
	// PARAGLIDE
	import { m } from '@/paraglide/messages';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import { NativeSelect } from '@/components/ui/select/index.js';

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

<NativeSelect
	class="w-36"
	value={searchField}
	onChange={(v) => (searchField = (v as 'email' | 'name') || 'email')}
	options={[
		{ value: 'email', label: m['AdminUsersPage.UsersFilters.searchFieldEmail']() },
		{ value: 'name', label: m['AdminUsersPage.UsersFilters.searchFieldName']() }
	]}
/>

<NativeSelect
	class="w-32"
	value={role ?? ''}
	onChange={(v) => (role = v === '' ? undefined : (v as 'user' | 'admin'))}
	options={[
		{ value: '', label: m['AdminUsersPage.UsersFilters.anyRole']() },
		{ value: 'user', label: m['AdminUsersPage.UsersFilters.roleUser']() },
		{ value: 'admin', label: m['AdminUsersPage.UsersFilters.roleAdmin']() }
	]}
/>

<NativeSelect
	class="w-36"
	value={banned === undefined ? '' : String(banned)}
	onChange={(v) => (banned = v === '' ? undefined : v === 'true')}
	options={[
		{ value: '', label: m['AdminUsersPage.UsersFilters.anyStatus']() },
		{ value: 'true', label: m['AdminUsersPage.UsersFilters.statusBanned']() },
		{ value: 'false', label: m['AdminUsersPage.UsersFilters.statusActive']() }
	]}
/>

<NativeSelect
	class="w-44"
	value={emailVerified === undefined ? '' : String(emailVerified)}
	onChange={(v) => (emailVerified = v === '' ? undefined : v === 'true')}
	options={[
		{ value: '', label: m['AdminUsersPage.UsersFilters.anyVerification']() },
		{ value: 'true', label: m['AdminUsersPage.UsersFilters.verified']() },
		{ value: 'false', label: m['AdminUsersPage.UsersFilters.unverified']() }
	]}
/>

{#if hasActiveFilter}
	<Button variant="ghost" size="sm" onclick={clearFilters}>{m['AdminUsersPage.UsersFilters.clear']()}</Button>
{/if}
