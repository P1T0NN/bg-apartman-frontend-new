<script lang="ts" generics="T extends Record<string, unknown>">
	// COMPONENTS
	import { Link } from '@/components/ui/link/index.js';
	import { TableCell, TableRow } from '@/components/ui/table/index.js';
	import { Checkbox } from '@/components/ui/checkbox/index.js';
	import CopyButton from '@/components/ui/copy-button/copy-button.svelte';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';

	// UTILS
	import { cn } from '@/utils/utils.js';
	import { breakpointTableClass, formatCellValue } from './dataTableUtils.js';

	// TYPES
	import type { ColumnDef, DataTableCustomCells, DataTableExpandedContent } from './types.js';

	let {
		row,
		columns,
		customCells,
		selectable = false,
		isSelected = false,
		onToggle,
		expandedContent,
		isExpanded = false,
		onToggleExpand,
		rowLabel
	}: {
		row: T;
		columns: ColumnDef<T>[];
		customCells?: DataTableCustomCells<T>;
		selectable?: boolean;
		isSelected?: boolean;
		onToggle?: () => void;
		/** Detail row shown beneath this one while expanded. */
		expandedContent?: DataTableExpandedContent<T>;
		isExpanded?: boolean;
		onToggleExpand?: () => void;
		/** Accessible name for the disclosure button, e.g. the booking code. */
		rowLabel?: string;
	} = $props();

	// Detail spans every visible column plus the checkbox / disclosure gutters. Over-spanning
	// is harmless in HTML tables and beats recomputing the responsive visible-column count.
	const detailColSpan = $derived(columns.length + (selectable ? 1 : 0) + 1);
</script>

<TableRow
	class={cn(
		'border-b transition-colors hover:bg-muted/30',
		isSelected && 'bg-muted/50 hover:bg-muted/60'
	)}
	aria-selected={selectable ? isSelected : undefined}
	data-state={selectable && isSelected ? 'selected' : undefined}
>
	{#if selectable}
		<TableCell class="w-10 px-4 py-3 align-middle">
			<Checkbox
				checked={isSelected}
				onCheckedChange={() => onToggle?.()}
				aria-label={isSelected ? 'Deselect row' : 'Select row'}
			/>
		</TableCell>
	{/if}
	{#if expandedContent}
		<TableCell class="w-10 px-2 py-3 align-middle">
			<button
				type="button"
				class="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
				aria-expanded={isExpanded}
				aria-label={isExpanded
					? `Hide details${rowLabel ? ` for ${rowLabel}` : ''}`
					: `Show details${rowLabel ? ` for ${rowLabel}` : ''}`}
				onclick={() => onToggleExpand?.()}
			>
				<ChevronRightIcon
					class={cn('size-4 transition-transform', isExpanded && 'rotate-90')}
					aria-hidden="true"
				/>
			</button>
		</TableCell>
	{/if}
	{#each columns as col (col.id)}
		{@const value = col.accessor(row)}
		<TableCell
			class={cn(
				'max-w-[16rem] px-4 py-3 whitespace-normal',
				breakpointTableClass(col.hideBelow),
				col.cellClass
			)}
		>
			<div class={cn('min-w-0', col.hasCopy && 'flex items-center gap-1.5')}>
				<div class={cn('min-w-0 flex-1', !col.wrap && 'truncate')}>
					{#if customCells?.[col.id]}
						{@render customCells[col.id]!({ row, column: col, value })}
					{:else if col.linkHref}
						<Link
							href={col.linkHref(row)}
							class={cn(
								'block font-medium text-primary underline-offset-2 hover:underline',
								!col.wrap && 'truncate'
							)}
							title={formatCellValue(value)}
						>
							{formatCellValue(value)}
						</Link>
					{:else}
						<span class={cn('block', !col.wrap && 'truncate')} title={formatCellValue(value)}>
							{formatCellValue(value)}
						</span>
					{/if}
				</div>
				{#if col.hasCopy}
					<CopyButton value={formatCellValue(value)} label={`Copy ${col.header}`} />
				{/if}
			</div>
		</TableCell>
	{/each}
</TableRow>

{#if expandedContent && isExpanded}
	<TableRow class="border-b bg-muted/20 hover:bg-muted/20">
		<TableCell colspan={detailColSpan} class="px-4 py-4">
			{@render expandedContent({ row })}
		</TableCell>
	</TableRow>
{/if}
