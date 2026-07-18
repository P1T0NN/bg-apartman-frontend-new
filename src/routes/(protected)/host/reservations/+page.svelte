<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useConvexClient } from 'convex-svelte';
	import { getLocale } from '@/shared/lib/paraglide/runtime';
	import { m } from '@/shared/lib/paraglide/messages';

	// COMPONENTS
	import SvelteHead from '@/shared/components/ui/svelte-head/svelte-head.svelte';
	import ReservationsHeader from '@/shared/components/pages/(protected)/host/reservations/reservations-header.svelte';
	import HostReservationsPageError from '@/shared/components/pages/(protected)/host/reservations/error/host-reservations-page-error.svelte';
	import BookingsTable from '@/features/bookings/components/bookings-table/bookings-table.svelte';
	import DeclineBookingDialog from '@/features/bookings/components/bookings-table/decline-booking-dialog.svelte';
	import CancelBookingDialog from '@/features/bookings/components/bookings-table/cancel-booking-dialog.svelte';

	// UTILS
	import { safeMutation } from '@/utils/convexHelpers';
	import { toastResult } from '@/utils/toastResult';

	// TYPES
	import type {
		typesBookingSafe,
		typesBookingAction
	} from '@/shared/features/booking/types/bookingTypes';

	const convex = useConvexClient();

	// Destructive actions open a confirmation dialog; the sheet's action just picks the target.
	let declineTarget = $state<typesBookingSafe | null>(null);
	let declineOpen = $state(false);
	let cancelTarget = $state<typesBookingSafe | null>(null);
	let cancelOpen = $state(false);

	async function handleAction(booking: typesBookingSafe, action: typesBookingAction) {
		if (action === 'decline') {
			declineTarget = booking;
			declineOpen = true;
			return;
		}

		if (action === 'cancel') {
			cancelTarget = booking;
			cancelOpen = true;
			return;
		}

		if (action === 'confirm') {
			const result = await safeMutation(
				convex,
				api.tables.bookings.mutations.confirmBooking.confirmBooking,
				{
					bookingId: booking._id,
					locale: getLocale()
				}
			);
			toastResult(result);
		}
		// check_in / check_out are cron-driven — the sheet never emits them as host actions.
	}
</script>

<SvelteHead
	title={m['HostReservationsPage.SEO.title']()}
	description={m['HostReservationsPage.SEO.description']()}
	noIndex
/>

<section class="flex w-full flex-col gap-6 p-4 md:p-6">
	<ReservationsHeader />

	<BookingsTable
		query={api.tables.bookings.queries.fetchHostBookingsSafe.fetchHostBookingsSafe}
		onAction={handleAction}
		{errorContent}
	/>
</section>

{#snippet errorContent()}
	<HostReservationsPageError />
{/snippet}

<DeclineBookingDialog booking={declineTarget} bind:open={declineOpen} />
<CancelBookingDialog booking={cancelTarget} bind:open={cancelOpen} />
