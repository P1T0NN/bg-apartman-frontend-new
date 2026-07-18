<script lang="ts">
	// LIBRARIES
	import { localizeHref } from '@/shared/lib/paraglide/runtime';
	import { m } from '@/shared/lib/paraglide/messages';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/routeEndpoints';

	// COMPONENTS
	import { Badge } from '@/shared/components/ui/badge/index.js';
	import { NativeTooltip } from '@/shared/components/ui/native-tooltip/index.js';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// DATA
	import {
		BOOKING_STATUS_CONFIG,
		PAYMENT_STATUS_CONFIG
	} from '@/features/bookings/data/bookingsData';

	// TYPES
	import type { typesBookingsStatusProps } from '@/features/bookings/types/bookingsSvelteOnlyTypes';

	// LUCIDE ICONS
	import CircleHelpIcon from '@lucide/svelte/icons/circle-help';

	let props: typesBookingsStatusProps = $props();

	const tone = $derived(
		props.kind === 'booking'
			? BOOKING_STATUS_CONFIG[props.status]
			: PAYMENT_STATUS_CONFIG[props.status]
	);
	const variant = $derived(props.variant ?? 'badge');
	
	// Payment statuses don't map to the booking-status guide, so help is booking-only.
	const showHelp = $derived(props.kind === 'booking' && (props.showHelp ?? true));
</script>

{#snippet statusEl()}
	{#if variant === 'badge'}
		<Badge class={cn('ring-1', tone.badgeClass)}>{tone.label}</Badge>
	{:else}
		<span class="inline-flex items-center gap-1.5 text-xs font-medium">
			<span class={cn('size-2 shrink-0 rounded-full', tone.dotClass)} aria-hidden="true"></span>
			{tone.label}
		</span>
	{/if}
{/snippet}

{#if showHelp}
	<span class="inline-flex items-center gap-1.5">
		{@render statusEl()}

		<NativeTooltip content={m['BookingsStatus.learnMore']()} class="inline-flex">
			<a
				href={localizeHref(UNPROTECTED_PAGE_ENDPOINTS.BOOKING_STATUS_EXPLANATION)}
				target="_blank"
				rel="noopener noreferrer"
				aria-label={m['BookingsStatus.learnMoreAria']()}
				class="inline-flex rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
			>
				<CircleHelpIcon class="size-4" aria-hidden="true" />
			</a>
		</NativeTooltip>
	</span>
{:else}
	{@render statusEl()}
{/if}
