<script lang="ts" generics="T extends Record<string, unknown>">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';

	// COMPONENTS
	import { Card } from '@/shared/components/ui/card/index.js';
	import { Link } from '@/shared/components/ui/link/index.js';
	import { Checkbox } from '@/shared/components/ui/checkbox/index.js';
	import CopyButton from '@/shared/components/ui/copy-button/copy-button.svelte';

	// UTILS
	import { cn } from '@/shared/utils/utils.js';
	import { formatCellValue } from './dataTableUtils.js';

	// TYPES
	import type { ColumnDef, DataTableCustomCells } from './types.js';

	let {
		row,
		columns,
		customCells,
		selectable = false,
		isSelected = false,
		onToggle
	}: {
		row: T;
		columns: ColumnDef<T>[];
		customCells?: DataTableCustomCells<T>;
		selectable?: boolean;
		isSelected?: boolean;
		onToggle?: () => void;
	} = $props();
</script>

<Card
	class={cn(
		'gap-0 px-4 py-4 transition-colors',
		isSelected && 'bg-muted/40 ring-1 ring-primary/40'
	)}
	role="listitem"
	aria-selected={selectable ? isSelected : undefined}
>
	{#if selectable}
		<div class="mb-3 flex items-center">
			<Checkbox
				checked={isSelected}
				onCheckedChange={() => onToggle?.()}
				aria-label={isSelected ? m['DataTable.deselectRow']() : m['DataTable.selectRow']()}
			/>
		</div>
	{/if}
	<dl class="flex flex-col gap-3">
		{#each columns as col (col.id)}
			{@const value = col.accessor(row)}
			<div
				class="grid grid-cols-1 gap-1 sm:grid-cols-[minmax(0,7rem)_minmax(0,1fr)] sm:gap-3"
			>
				<dt
					class="text-muted-foreground text-xs font-semibold tracking-wide uppercase sm:text-sm"
				>
					{col.header}
				</dt>
				<dd class="text-foreground min-w-0 text-sm font-medium">
					<div class={cn('min-w-0', col.hasCopy && 'flex items-start gap-1.5')}>
						<div class="min-w-0 flex-1">
							{#if customCells?.[col.id]}
								{@render customCells[col.id]!({ row, column: col, value })}
							{:else if col.linkHref}
								<Link
									href={col.linkHref(row)}
									class="text-primary font-medium underline-offset-2 hover:underline wrap-break-word"
									title={formatCellValue(value)}
								>
									{formatCellValue(value)}
								</Link>
							{:else}
								<span class="block wrap-break-word" title={formatCellValue(value)}>
									{formatCellValue(value)}
								</span>
							{/if}
						</div>
						{#if col.hasCopy}
							<CopyButton value={formatCellValue(value)} label={`Copy ${col.header}`} />
						{/if}
					</div>
				</dd>
			</div>
		{/each}
	</dl>
</Card>
