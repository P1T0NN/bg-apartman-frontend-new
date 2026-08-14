import { m } from '@/lib/paraglide/messages';

// TYPES
import type { typesStatusConfig } from '@/components/ui/feature-status/types';
import type { typesAccommodationStatus } from '@/shared/features/accommodation/types/accommodationTypes';

/**
 * Listing status → label + badge tone. Svelte-only display config; mirrors
 * `apartmentStatus` in `accommodationsSchemas.ts`, so a new status fails to compile here
 * until it is given a presentation (AccommodationsSystemDesign.md §1).
 *
 * Rendered through `accommodation-status.svelte` — never re-derive labels or classes at a
 * call site.
 */
export const ACCOMMODATION_STATUS_CONFIG: typesStatusConfig<typesAccommodationStatus> = {
	pending_review: {
		label: m['accommodationsData.pendingReview'](),
		badgeClass: 'bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300',
		dotClass: 'bg-amber-500'
	},
	published: {
		label: m['accommodationsData.published'](),
		badgeClass: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300',
		dotClass: 'bg-emerald-500'
	},
	suspended: {
		label: m['accommodationsData.suspended'](),
		badgeClass: 'bg-destructive/10 text-destructive ring-destructive/20',
		dotClass: 'bg-destructive'
	},
	// Billing lapse, not moderation — amber (actionable, host can renew) rather than
	// destructive, which would read as "you did something wrong".
	expired: {
		label: m['accommodationsData.expired'](),
		badgeClass: 'bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300',
		dotClass: 'bg-amber-500'
	},
	archived: {
		label: m['accommodationsData.archived'](),
		badgeClass: 'bg-muted text-muted-foreground ring-border',
		dotClass: 'bg-muted-foreground'
	}
};
