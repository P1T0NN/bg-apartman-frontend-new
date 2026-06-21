<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { m } from '@/shared/lib/paraglide/messages';

	// COMPONENTS
	import DataTable from '@/shared/components/ui/data-table/convex-data-table.svelte';

	// UTILS
	import { capitalizeFirst } from '@/shared/utils/stringUtils';

	// TYPES
	import type { Doc } from '@/convex/_generated/dataModel';
	import type {
		ColumnDef,
		DataTableCellSnippetProps
	} from '@/shared/components/ui/data-table/types.js';

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
			header: m['AdminUserPage.UserActivity.colAction'](),
			accessor: (r) => formatAction(r.action)
		},
		{
			id: 'status',
			header: m['AdminUserPage.UserActivity.colStatus'](),
			accessor: (r) =>
				r.status === 'failure'
					? m['AdminUserPage.UserActivity.statusFailed']()
					: m['AdminUserPage.UserActivity.statusSuccess'](),
			hideBelow: 'md'
		},
		{
			id: 'resource',
			header: m['AdminUserPage.UserActivity.colResource'](),
			accessor: (r) => (r.resource ? `${r.resource.table}#${r.resource.id}` : '—'),
			hideBelow: 'lg',
			cellClass: 'max-w-[16rem]'
		},
		{
			id: 'ip',
			header: m['AdminUserPage.UserActivity.colIp'](),
			accessor: (r) => r.ip ?? '—',
			hideBelow: 'lg'
		},
		{
			id: 'createdAt',
			header: m['AdminUserPage.UserActivity.colWhen'](),
			accessor: (r) => new Date(r._creationTime).toLocaleString(),
			sortable: true
		}
	];
</script>

<div class="flex flex-col gap-4">
	<header class="flex flex-col gap-0.5">
		<h2 class="text-base font-semibold">{m['AdminUserPage.UserActivity.title']()}</h2>
		<p class="text-sm text-muted-foreground">
			{m['AdminUserPage.UserActivity.description']()}
		</p>
	</header>

	<DataTable
		caption={m['AdminUserPage.UserActivity.caption']()}
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
			{m['AdminUserPage.UserActivity.statusFailed']()}
		</span>
	{:else}
		<span class="rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
			{m['AdminUserPage.UserActivity.statusSuccess']()}
		</span>
	{/if}
{/snippet}
