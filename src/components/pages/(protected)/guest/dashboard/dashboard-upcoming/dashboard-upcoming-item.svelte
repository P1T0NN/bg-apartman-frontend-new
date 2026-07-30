<script lang="ts">
	// CONFIG
	import { PROTECTED_PAGE_ENDPOINTS } from '@/config/routeEndpoints.js';

	// COMPONENTS
	import * as Card from '@/components/ui/card/index.js';
	import { FeatureStatus } from '@/components/ui/feature-status/index.js';

	// DATA
	import {
		BOOKING_STATUS_CONFIG,
		BOOKING_STATUS_HELP
	} from '@/features/bookings/data/bookingsData';

	// UTILS
	import { formatDate } from '@/utils/formatters';

	// TYPES
	import type { GuestTripSummary } from '@/convex/pages/guest/dashboard/types/guestDashboardTypes';

	// LUCIDE ICONS
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';

	let { trip }: { trip: GuestTripSummary } = $props();
</script>

<a
	href={PROTECTED_PAGE_ENDPOINTS.GUEST_MY_BOOKINGS}
	class="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
>
	<Card.Root class="flex-row items-center gap-4 p-3 transition hover:bg-muted/40">
		<img
			src={trip.apartment.imageUrl}
			alt={trip.apartment.title}
			loading="lazy"
			class="size-16 shrink-0 rounded-lg object-cover"
		/>
		<div class="min-w-0 flex-1">
			<p class="truncate font-medium">{trip.apartment.title}</p>
			<p class="truncate text-sm text-muted-foreground">
				{trip.apartment.city} · {formatDate(trip.checkInDate)} – {formatDate(trip.checkOutDate)}
			</p>
		</div>
		<div class="max-sm:hidden">
			<FeatureStatus
				config={BOOKING_STATUS_CONFIG}
				status={trip.status}
				help={BOOKING_STATUS_HELP}
			/>
		</div>
		<ArrowRightIcon class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
	</Card.Root>
</a>
