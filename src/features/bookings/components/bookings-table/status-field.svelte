<script lang="ts">
	// COMPONENTS
	import { FeatureStatus } from '@/components/ui/feature-status/index.js';

	// DATA
	import { BOOKING_STATUS_CONFIG } from '@/features/bookings/data/bookingsData';

	// TYPES
	import type { typesBookingSafe } from '@/shared/features/booking/types/bookingTypes';

	let { booking }: { booking: typesBookingSafe } = $props();
</script>

<FeatureStatus config={BOOKING_STATUS_CONFIG} status={booking.status} />
