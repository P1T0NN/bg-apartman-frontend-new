<script lang="ts" generics="T extends Record<string, unknown>">
	// COMPONENTS
	import { Card } from '@/components/ui/card/index.js';
	import { Link } from '@/components/ui/link/index.js';
	import { Checkbox } from '@/components/ui/checkbox/index.js';
	import CopyButton from '@/components/ui/copy-button/copy-button.svelte';

	// UTILS
	import { cn } from '@/utils/utils.js';
	import { formatCellValue } from './dataTableUtils.js';

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
		/** Detail shown inside this card while expanded. */
		expandedContent?: DataTableExpandedContent<T>;
		isExpanded?: boolean;
		onToggleExpand?: () => void;
		/** Accessible name for the disclosure button, e.g. the booking code. */
		rowLabel?: string;
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
				aria-label={isSelected ? 'Deselect row' : 'Select row'}
			/>
		</div>
	{/if}
	<dl class="flex flex-col gap-3">
		{#each columns as col (col.id)}
			{@const value = col.accessor(row)}
			<div class="grid grid-cols-1 gap-1 sm:grid-cols-[minmax(0,7rem)_minmax(0,1fr)] sm:gap-3">
				<dt class="text-xs font-semibold tracking-wide text-muted-foreground uppercase sm:text-sm">
					{col.header}
				</dt>
				<dd class="min-w-0 text-sm font-medium text-foreground">
					<div class={cn('min-w-0', col.hasCopy && 'flex items-start gap-1.5')}>
						<div class="min-w-0 flex-1">
							{#if customCells?.[col.id]}
								{@render customCells[col.id]!({ row, column: col, value })}
							{:else if col.linkHref}
								<Link
									href={col.linkHref(row)}
									class="font-medium wrap-break-word text-primary underline-offset-2 hover:underline"
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

	{#if expandedContent}
		<button
			type="button"
			class="mt-3 flex items-center gap-1.5 self-start text-sm font-medium text-primary underline-offset-2 hover:underline"
			aria-expanded={isExpanded}
			aria-label={isExpanded
				? `Hide details${rowLabel ? ` for ${rowLabel}` : ''}`
				: `Show details${rowLabel ? ` for ${rowLabel}` : ''}`}
			onclick={() => onToggleExpand?.()}
		>
			{isExpanded ? 'Hide details' : 'Show details'}
		</button>

		{#if isExpanded}
			<div class="mt-3 border-t pt-3">
				{@render expandedContent({ row })}
			</div>
		{/if}
	{/if}
</Card>
