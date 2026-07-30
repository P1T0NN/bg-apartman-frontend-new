<script lang="ts">
	// UTILS
	import { cn } from '@/utils/utils.js';
	import { REPORT_CATEGORY_TONE, reportAgo } from '@/features/reports/data/reportsData';

	// TYPES
	import type { AdminReportRow } from '@/convex/tables/reports/queries/listReportsSafe';

	// LUCIDE ICONS
	import MailIcon from '@lucide/svelte/icons/mail';

	/**
	 * The report itself, under its row. Prose gets full width and wraps in full here — the
	 * table cell above only ever showed a preview (AdminPagesSystemDesign.md §4), and
	 * truncating the one thing the reader came for would be absurd.
	 */
	let { report }: { report: AdminReportRow } = $props();

	const tone = $derived(REPORT_CATEGORY_TONE[report.category]);
</script>

<div class="flex flex-col gap-3">
	<div class="flex flex-wrap items-center gap-2">
		<span
			class={cn(
				'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
				tone.badgeClass
			)}
		>
			{tone.label}
		</span>
		<span class="text-xs text-muted-foreground tabular-nums">
			{reportAgo(report._creationTime)}
		</span>
		{#if report.status === 'resolved'}
			<span class="text-xs text-muted-foreground">· Resolved</span>
		{/if}
	</div>

	<p class="max-w-prose text-sm wrap-break-word whitespace-pre-wrap">{report.message}</p>

	{#if report.email}
		<a
			href={`mailto:${report.email}`}
			class="flex items-center gap-1.5 self-start text-xs text-primary hover:underline"
		>
			<MailIcon class="size-3.5" aria-hidden="true" />
			Reply to {report.email}
		</a>
	{/if}
</div>
