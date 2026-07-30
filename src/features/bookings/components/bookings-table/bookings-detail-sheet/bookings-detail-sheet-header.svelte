<script lang="ts">
	// COMPONENTS
	import { FeatureStatus } from '@/components/ui/feature-status/index.js';

	// DATA
	import {
		BOOKING_STATUS_CONFIG,
		BOOKING_STATUS_HELP,
		PAYMENT_STATUS_CONFIG
	} from '@/features/bookings/data/bookingsData';

	// UTILS
	import { initials } from '@/shared/utils/stringUtils';

	// TYPES
	import type { typesBookingSafe } from '@/shared/features/booking/types/bookingTypes';

	let { booking }: { booking: typesBookingSafe } = $props();

	const guestName = $derived(`${booking.guestFirstName} ${booking.guestLastName}`);
</script>

<header class="flex flex-col gap-3 border-b p-4">
	<div class="flex items-start gap-3 pr-8">
		<div
			class="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground ring-1 ring-border"
			aria-hidden="true"
		>
			{initials(guestName)}
		</div>
		<div class="min-w-0 flex-1">
			<h2 class="truncate text-base font-semibold">{guestName}</h2>
			<p class="font-mono text-xs text-muted-foreground">{booking.bookingCode}</p>
		</div>
	</div>
	<div class="flex flex-wrap items-center gap-2">
		<FeatureStatus
			config={BOOKING_STATUS_CONFIG}
			status={booking.status}
			help={BOOKING_STATUS_HELP}
		/>
		<FeatureStatus config={PAYMENT_STATUS_CONFIG} status={booking.paymentStatus} />
	</div>
</header>
