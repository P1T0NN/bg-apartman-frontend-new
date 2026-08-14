<script lang="ts">
	// I18N
	import { m } from '@/lib/paraglide/messages';

	// CONFIG
	import { ADMIN_PAGE_ENDPOINTS } from '@/config/routeEndpoints';

	// UTILS
	import { appHref } from '@/utils/app-navigation.js';

	// COMPONENTS
	import { Card } from '@/components/ui/card/index.js';
	import { Button } from '@/components/ui/button/index.js';

	// DATA
	import { REPORT_CATEGORY_TONE, reportAgo } from '@/features/reports/data/reportsData';

	// UTILS
	import { cn } from '@/utils/utils.js';
	import { getLocale } from '@/lib/paraglide/runtime';

	// TYPES
	import type { AdminDashboardPage } from '@/convex/pages/admin/dashboard/types/adminDashboardTypes';

	// LUCIDE ICONS
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import MailIcon from '@lucide/svelte/icons/mail';

	/**
	 * Band 1 — "does anything need me?" The newest five unresolved reports; the full inbox
	 * is `/admin/reports`. Renders NOTHING when the queue is empty — an "all clear" box is
	 * noise, absence is the answer (AdminDashboardPageSystemDesign.md §2).
	 */
	let { data }: { data: AdminDashboardPage['reportsQueue'] } = $props();

	const countChip = $derived(data.total > 99 ? '99+' : String(data.total));
</script>

{#if data.total > 0}
	<Card class="gap-3 p-4 sm:p-5">
		<div class="flex items-center justify-between gap-3">
			<div class="flex items-center gap-2">
				<h2
					class="text-[0.6875rem] font-semibold tracking-[0.22em] text-muted-foreground uppercase"
				>
					{m['AdminDashboardPage.AdminDashboardReportsQueue.needsAttention']()}
				</h2>
				<span
					class="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive tabular-nums ring-1 ring-destructive/20 ring-inset"
				>
					{m['AdminDashboardPage.AdminDashboardReportsQueue.newCount']({ count: countChip })}
				</span>
			</div>

			<Button href={appHref(ADMIN_PAGE_ENDPOINTS.REPORTS)} variant="ghost" size="sm">
				{m['AdminDashboardPage.AdminDashboardReportsQueue.allReports']()}
				<ArrowRightIcon class="size-4" aria-hidden="true" />
			</Button>
		</div>

		<ul class="flex flex-col divide-y">
			{#each data.items as report (report._id)}
				{@const tone = REPORT_CATEGORY_TONE[report.category]}
				<li class="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
					<span
						class={cn(
							'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
							tone.badgeClass
						)}
					>
						{tone.label}
					</span>

					<p class="min-w-0 flex-1 truncate text-sm">{report.message}</p>

					<span
						class="shrink-0 text-xs text-muted-foreground tabular-nums"
						title={new Date(report._creationTime).toLocaleString(getLocale())}
					>
						{reportAgo(report._creationTime)}
					</span>

					{#if report.email}
						<a
							href={`mailto:${report.email}`}
							class="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline"
						>
							<MailIcon class="size-3.5" aria-hidden="true" />
							{m['AdminDashboardPage.AdminDashboardReportsQueue.reply']()}
						</a>
					{/if}
				</li>
			{/each}
		</ul>
	</Card>
{/if}
