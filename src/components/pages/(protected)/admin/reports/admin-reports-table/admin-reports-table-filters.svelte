<script lang="ts">
	// I18N
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import { NativeSelect } from '@/components/ui/select/index.js';

	// UTILS
	import { cn } from '@/utils/utils.js';
	import { REPORT_CATEGORIES } from '@/shared/features/report/schemas/reportsSchemas';

	// DATA
	import { REPORT_CATEGORY_TONE } from '@/features/reports/data/reportsData';

	// TYPES
	import type { ReportCategory } from '@/shared/features/report/schemas/reportsSchemas';

	/**
	 * Two views, not a filter dropdown (AdminPagesSystemDesign.md §4): the admin's job here
	 * is draining New to zero, and "All" exists for "what did someone say last month".
	 *
	 * Both bind straight through — the table reads them for its `queryArgs` and its
	 * empty-state copy, so it owns the values while this owns how they're picked.
	 */
	let {
		view = $bindable('new'),
		category = $bindable(undefined)
	}: {
		view?: 'new' | 'all';
		category?: ReportCategory | undefined;
	} = $props();

	const viewOptions = [
		{ value: 'new' as const, label: m['AdminReportsPage.AdminReportsTableFilters.new']() },
		{ value: 'all' as const, label: m['AdminReportsPage.AdminReportsTableFilters.all']() }
	];

	const categoryOptions = [
		{ value: '', label: m['AdminReportsPage.AdminReportsTableFilters.anyCategory']() },
		...REPORT_CATEGORIES.map((c) => ({ value: c, label: REPORT_CATEGORY_TONE[c].label }))
	];
</script>

<div class="inline-flex rounded-lg border p-0.5" role="group" aria-label={m['AdminReportsPage.AdminReportsTableFilters.reportView']()}>
	{#each viewOptions as option (option.value)}
		<button
			type="button"
			class={cn(
				'rounded-md px-3 py-1 text-sm font-medium transition-colors',
				view === option.value
					? 'bg-primary text-primary-foreground'
					: 'text-muted-foreground hover:text-foreground'
			)}
			aria-pressed={view === option.value}
			onclick={() => (view = option.value)}
		>
			{option.label}
		</button>
	{/each}
</div>

<NativeSelect
	class="w-40"
	value={category ?? ''}
	onChange={(v) => (category = v === '' ? undefined : (v as ReportCategory))}
	options={categoryOptions}
	ariaLabel={m['AdminReportsPage.AdminReportsTableFilters.filterByCategory']()}
/>
