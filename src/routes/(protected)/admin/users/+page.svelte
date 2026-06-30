<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { m } from '@/shared/lib/paraglide/messages';
	import { localizeHref } from '@/shared/lib/paraglide/runtime';

	// CONFIG
	import { ADMIN_PAGE_ENDPOINTS } from '@/shared/routeEndpoints.js';

	// COMPONENTS
	import SvelteHead from '@/shared/components/ui/svelte-head/svelte-head.svelte';
	import DataTable from '@/shared/components/ui/data-table/convex-data-table.svelte';
	import { Avatar, AvatarImage, AvatarFallback } from '@/shared/components/ui/avatar/index.js';
	import UsersFilters from '@/shared/components/pages/(protected)/admin/users/users-filters.svelte';

	// UTILS
	import { capitalizeFirst } from '@/shared/utils/stringUtils';

	// TYPES
	import type {
		ColumnDef,
		DataTableCellSnippetProps
	} from '@/shared/components/ui/data-table/types.js';
	import type { Doc } from '@/convex/auth/component/_generated/dataModel';

	// Filter / sort / search state — forwarded to `listUsers` via DataTable's
	// `queryArgs` (filters) + `bind:sortColumn` (sort) + `bind:search` (search text).
	let searchField = $state<'email' | 'name'>('email');
	let role = $state<'user' | 'admin' | undefined>(undefined);
	let banned = $state<boolean | undefined>(undefined);
	let emailVerified = $state<boolean | undefined>(undefined);
	let sortColumn = $state<string | undefined>(undefined);
	let sortDirection = $state<'asc' | 'desc' | undefined>(undefined);
	let search = $state<string>('');

	const queryArgs = $derived({
		searchField,
		...(role !== undefined && { role }),
		...(banned !== undefined && { banned }),
		...(emailVerified !== undefined && { emailVerified })
	});

	const columns: ColumnDef<Doc<'user'>>[] = [
		{
			id: 'name',
			header: m['AdminUsersPage.columnUser'](),
			accessor: (r) => capitalizeFirst(r.name || r.email),
			sortable: true
		},
		{
			id: 'email',
			header: m['AdminUsersPage.columnEmail'](),
			accessor: (r) => r.email,
			hideBelow: 'md'
		},
		{
			id: 'role',
			header: m['AdminUsersPage.columnRole'](),
			accessor: (r) => capitalizeFirst(r.role),
			hideBelow: 'md'
		},
		{
			id: 'emailVerified',
			header: m['AdminUsersPage.columnVerified'](),
			accessor: (r) =>
				r.emailVerified ? m['AdminUsersPage.verifiedYes']() : m['AdminUsersPage.verifiedNo'](),
			hideBelow: 'lg'
		},
		{
			id: 'banned',
			header: m['AdminUsersPage.columnStatus'](),
			accessor: (r) =>
				r.banned ? m['AdminUsersPage.statusBanned']() : m['AdminUsersPage.statusActive'](),
			hideBelow: 'md'
		},
		{
			id: 'createdAt',
			header: m['AdminUsersPage.columnCreated'](),
			accessor: (r) => new Date(r._creationTime).toLocaleDateString(),
			sortable: true,
			hideBelow: 'lg'
		}
	];
</script>

<SvelteHead />

<section class="flex w-full flex-col gap-4 p-4 md:p-6">
	<header class="flex flex-col gap-1">
		<h1 class="text-2xl font-semibold tracking-tight">{m['AdminUsersPage.title']()}</h1>
		<p class="text-sm text-muted-foreground">{m['AdminUsersPage.description']()}</p>
	</header>

	<DataTable
		caption={m['AdminUsersPage.caption']()}
		query={api.tables.users.userQueries.listUsers}
		{queryArgs}
		{columns}
		getRowId={(r) => r._id}
		customCells={{ name: nameCell }}
		bind:sortColumn
		bind:sortDirection
		searchable
		bind:search
		searchPlaceholder={m['AdminUsersPage.searchPlaceholder']({
			field: capitalizeFirst(searchField)
		})}
		{filters}
	/>
</section>

{#snippet filters()}
	<UsersFilters bind:searchField bind:role bind:banned bind:emailVerified />
{/snippet}

{#snippet nameCell({ row }: DataTableCellSnippetProps<Doc<'user'>>)}
	<a
		href={localizeHref(ADMIN_PAGE_ENDPOINTS.USER.replace(':id', row._id))}
		class="flex items-center gap-2 hover:underline"
	>
		<Avatar class="size-7">
			{#if row.image}
				<AvatarImage src={row.image} alt={row.name || row.email} />
			{/if}

			<AvatarFallback>
				{(row.name || row.email).slice(0, 2).toUpperCase()}
			</AvatarFallback>
		</Avatar>

		<span class="font-medium">{capitalizeFirst(row.name || row.email)}</span>
	</a>
{/snippet}
