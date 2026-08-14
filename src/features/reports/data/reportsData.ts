// I18N
import { m } from '@/lib/paraglide/messages';

// TYPES
import type { ReportCategory } from '@/shared/features/report/schemas/reportsSchemas';

/**
 * Report category → label + tone (AdminPagesSystemDesign.md §4). Always colour AND text,
 * never colour alone — the inbox has to be readable without colour vision.
 *
 * `Record` keyed by the category union makes it exhaustive: a new category fails to
 * compile until it is given a presentation.
 */
export const REPORT_CATEGORY_TONE: Record<ReportCategory, { label: string; badgeClass: string }> = {
	bug: {
		label: m['reportsData.bug'](),
		badgeClass: 'bg-destructive/10 text-destructive ring-destructive/20'
	},
	idea: {
		label: m['reportsData.idea'](),
		badgeClass: 'bg-blue-500/10 text-blue-700 ring-blue-500/20 dark:text-blue-300'
	},
	other: {
		label: m['reportsData.other'](),
		badgeClass: 'bg-muted text-muted-foreground ring-border'
	}
};

/** "3h ago" / "2d ago" — reports are read by recency, not by exact timestamp. */
export function reportAgo(creationTime: number): string {
	const ms = Date.now() - creationTime;
	const minutes = Math.floor(ms / 60_000);
	if (minutes < 1) return m['reportsData.justNow']();
	if (minutes < 60) return m['reportsData.minutesAgo']({ minutes });
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return m['reportsData.hoursAgo']({ hours });
	const days = Math.floor(hours / 24);
	return m['reportsData.daysAgo']({ days });
}
