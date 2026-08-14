<script lang="ts">
	// I18N
	import { m } from '@/paraglide/messages';

	// CONFIG
	import { PROTECTED_PAGE_ENDPOINTS, UNPROTECTED_PAGE_ENDPOINTS } from '@/config/routeEndpoints.js';

	// UTILS
	import { appHref } from '@/utils/app-navigation.js';
	// COMPONENTS
	import * as Card from '@/components/ui/card/index.js';
	import { Button } from '@/components/ui/button/index.js';
	import { FeatureStatus } from '@/components/ui/feature-status/index.js';

	// UTILS
	import { countdownLabel, formatAdultsAndChildren, formatDate } from '@/utils/formatters';

	// DATA
	import {
		BOOKING_STATUS_CONFIG,
		BOOKING_STATUS_HELP
	} from '@/features/bookings/data/bookingsData';

	// TYPES
	import type { GuestTripSummary } from '@/convex/pages/guest/dashboard/types/guestDashboardTypes';

	// LUCIDE ICONS
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import UsersIcon from '@lucide/svelte/icons/users';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';

	let { trip }: { trip: GuestTripSummary } = $props();
</script>

<Card.Root class="overflow-hidden p-0">
	<div class="grid md:grid-cols-[minmax(0,1fr)_1.3fr]">
		<div class="relative aspect-4/3 bg-muted md:aspect-auto md:h-full">
			<img
				src={trip.apartment.imageUrl}
				alt={trip.apartment.title}
				loading="lazy"
				class="absolute inset-0 h-full w-full object-cover"
			/>
		</div>

		<div class="flex flex-col gap-5 p-5 md:p-6">
			<div class="flex flex-wrap items-center gap-2">
				<FeatureStatus
					config={BOOKING_STATUS_CONFIG}
					status={trip.status}
					help={BOOKING_STATUS_HELP}
				/>
				<span class="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
					{countdownLabel(trip.checkInDate)}
				</span>
			</div>

			<div class="space-y-1">
				<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
					{m['GuestDashboardPage.DashboardNextTrip.yourNextTrip']()}
				</p>
				<h2 class="text-xl font-semibold tracking-tight">{trip.apartment.title}</h2>
				<p class="flex items-center gap-1.5 text-sm text-muted-foreground">
					<MapPinIcon class="size-4 shrink-0" aria-hidden="true" />
					{trip.apartment.city}
				</p>
			</div>

			<dl class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
				<div>
					<dt class="text-xs text-muted-foreground">
						{m['GuestDashboardPage.DashboardNextTrip.checkIn']()}
					</dt>
					<dd class="font-medium">{formatDate(trip.checkInDate)}</dd>
				</div>
				<div>
					<dt class="text-xs text-muted-foreground">
						{m['GuestDashboardPage.DashboardNextTrip.checkOut']()}
					</dt>
					<dd class="font-medium">{formatDate(trip.checkOutDate)}</dd>
				</div>
				<div>
					<dt class="text-xs text-muted-foreground">
						{m['GuestDashboardPage.DashboardNextTrip.guests']()}
					</dt>
					<dd class="flex items-center gap-1.5 font-medium">
						<UsersIcon class="size-3.5 text-muted-foreground" aria-hidden="true" />
						{formatAdultsAndChildren(trip.numberOfAdults, trip.numberOfChildren)}
					</dd>
				</div>
				<div>
					<dt class="text-xs text-muted-foreground">
						{m['GuestDashboardPage.DashboardNextTrip.confirmation']()}
					</dt>
					<dd class="font-medium">{trip.bookingCode}</dd>
				</div>
			</dl>

			<div class="mt-auto flex flex-wrap gap-3 pt-1">
				<Button href={appHref(PROTECTED_PAGE_ENDPOINTS.GUEST_MY_BOOKINGS)}>
					{m['GuestDashboardPage.DashboardNextTrip.viewBooking']()}
					<ArrowRightIcon class="size-4" aria-hidden="true" />
				</Button>
				<Button variant="outline" href={appHref(UNPROTECTED_PAGE_ENDPOINTS.ROOT)}>
					{m['GuestDashboardPage.DashboardNextTrip.browseStays']()}
				</Button>
			</div>
		</div>
	</div>
</Card.Root>
