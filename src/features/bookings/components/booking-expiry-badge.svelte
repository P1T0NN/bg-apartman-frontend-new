<script lang="ts">
	// I18N
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import { Badge } from '@/components/ui/badge/index.js';

	// UTILS
	import { cn } from '@/utils/utils.js';
	import { getPendingExpiryChip } from '@/shared/features/booking/utils/getPendingExpiryChip';

	// TYPES
	import type { typesPendingExpiryTone } from '@/shared/features/booking/types/bookingTypes';

	/**
	 * A pending request's response deadline, as a badge.
	 *
	 * Fact-shaped, never a scold (HostSystemDesign.md §3): it states the moment
	 * ("Expires in 6h") so a host can plan around it. The urgency tone comes from the
	 * shared `getPendingExpiryChip`, which is also what the reservations queue sorts by —
	 * one definition of "how urgent is this", so the badge can never disagree with the row
	 * order it sits in.
	 *
	 * Renders nothing when there is no deadline: only `pending` bookings carry
	 * `pendingExpiresAt`, so every other status simply has no badge and callers need no
	 * `{#if}` of their own.
	 */
	let {
		expiresAt,
		class: className
	}: {
		/** The booking's `pendingExpiresAt`. Absent on every non-pending status. */
		expiresAt: number | undefined;
		class?: string;
	} = $props();

	const chip = $derived(getPendingExpiryChip(expiresAt));

	const label = $derived.by(() => {
		if (!chip) return null;
		if (chip.isExpired) return m['BookingsFeature.BookingExpiryBadge.expired']();
		return chip.timeRemaining ? m['BookingsFeature.BookingExpiryBadge.expiresIn']({ timeRemaining: chip.timeRemaining }) : null;
	});

	/**
	 * Tone → badge classes. `red`/`amber` are deliberately soft-filled rather than the
	 * `destructive` variant: an approaching deadline is urgency, not an error the host
	 * caused, and a solid red pill among normal requests reads as a failure.
	 */
	const toneClass: Record<typesPendingExpiryTone, string> = {
		red: 'bg-destructive/10 text-destructive',
		amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
		neutral: 'bg-muted text-muted-foreground'
	};
</script>

{#if chip && label}
	<Badge class={cn('shrink-0 tabular-nums', toneClass[chip.tone], className)}>
		{label}
	</Badge>
{/if}
