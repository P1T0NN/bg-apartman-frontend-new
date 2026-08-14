<script lang="ts">
	// PARAGLIDE
	import { m } from '@/lib/paraglide/messages';

	// LIBRARIES
	import { api } from '@/convex/_generated/api';

	// COMPONENTS
	import ConvexDataTable from '@/components/ui/data-table/convex-data-table.svelte';

	// UTILS
	import { capitalizeFirst } from '@/shared/utils/stringUtils';
	import { getLocale } from '@/lib/paraglide/runtime';

	// TYPES
	import type { Doc } from '@/convex/_generated/dataModel';
	import type { ColumnDef, DataTableCellSnippetProps } from '@/components/ui/data-table/types.js';

	let { userId }: { userId: string } = $props();

	let sortColumn = $state<string | undefined>(undefined);
	let sortDirection = $state<'asc' | 'desc' | undefined>(undefined);

	const queryArgs = $derived({ userId });

	/** `user.role.update` → `User role update`. */
	function formatAction(action: string): string {
		return capitalizeFirst(action.replaceAll('.', ' ').replaceAll('_', ' '));
	}

	const columns: ColumnDef<Doc<'auditLogs'>>[] = [
		{
			id: 'action',
			header: m['AdminUsersPage.UserActivity.columnAction'](),
			accessor: (r) => formatAction(r.action)
		},
		{
			id: 'status',
			header: m['AdminUsersPage.UserActivity.columnStatus'](),
			accessor: (r) =>
				r.status === 'failure'
					? m['AdminUsersPage.UserActivity.statusFailed']()
					: m['AdminUsersPage.UserActivity.statusSuccess'](),
			hideBelow: 'md'
		},
		{
			id: 'resource',
			header: m['AdminUsersPage.UserActivity.columnResource'](),
			accessor: (r) => (r.resource ? `${r.resource.table}#${r.resource.id}` : '—'),
			hideBelow: 'lg',
			cellClass: 'max-w-[16rem]'
		},
		{
			id: 'ip',
			header: m['AdminUsersPage.UserActivity.columnIp'](),
			accessor: (r) => r.ip ?? '—',
			hideBelow: 'lg'
		},
		{
			id: 'createdAt',
			header: m['AdminUsersPage.UserActivity.columnWhen'](),
			accessor: (r) => new Date(r._creationTime).toLocaleString(getLocale()),
			sortable: true
		}
	];
</script>

<div class="flex flex-col gap-4">
	<header class="flex flex-col gap-0.5">
		<h2 class="text-base font-semibold">{m['AdminUsersPage.UserActivity.title']()}</h2>
		<p class="text-sm text-muted-foreground">
			{m['AdminUsersPage.UserActivity.description']()}
		</p>
	</header>

	<ConvexDataTable
		caption={m['AdminUsersPage.UserActivity.title']()}
		query={api.tables.auditLog.queries.auditLogQueries.listAuditLogs}
		{queryArgs}
		{columns}
		getRowId={(r) => r._id}
		customCells={{ status: statusCell }}
		bind:sortColumn
		bind:sortDirection
	/>
</div>

{#snippet statusCell({ row }: DataTableCellSnippetProps<Doc<'auditLogs'>>)}
	{#if row.status === 'failure'}
		<span class="rounded bg-destructive/10 px-1.5 py-0.5 text-xs font-medium text-destructive">
			{m['AdminUsersPage.UserActivity.statusFailed']()}
		</span>
	{:else}
		<span class="rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
			{m['AdminUsersPage.UserActivity.statusSuccess']()}
		</span>
	{/if}
{/snippet}
