<script lang="ts">
	import { m } from '@/lib/paraglide/messages';

	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useQuery } from 'convex-svelte';

	// COMPONENTS
	import { NativeSheet } from '@/components/ui/native-sheet/index.js';
	import StayConfirmationPanel from '../stay-confirmation-panel.svelte';
	import BookingsDetailSheetHeader from './bookings-detail-sheet-header.svelte';
	import BookingsDetailSheetStayInfo from './bookings-detail-sheet-stay-info.svelte';
	import BookingsDetailSheetPropertyInfo from './bookings-detail-sheet-property-info.svelte';
	import BookingsDetailSheetGuestContact from './bookings-detail-sheet-guest-contact.svelte';
	import BookingsDetailSheetSpecialRequests from './bookings-detail-sheet-special-requests.svelte';
	import BookingsDetailSheetPriceBreakdown from './bookings-detail-sheet-price-breakdown.svelte';
	import BookingsDetailSheetCancellation from './bookings-detail-sheet-cancellation.svelte';
	import BookingsDetailSheetActions from './bookings-detail-sheet-actions.svelte';

	// UTILS
	import { availableBookingActions } from '@/features/bookings/utils/availableBookingActions';

	// TYPES
	import type { Id } from '@/convex/_generated/dataModel';
	import type {
		typesBookingSafe,
		typesBookingAction
	} from '@/shared/features/booking/types/bookingTypes';

	let {
		bookingId,
		open = $bindable(false),
		onOpenChange,
		onAction,
		getActions = availableBookingActions,
		hostName
	}: {
		/** Which booking the sheet shows. The sheet fetches it itself — one by-id
		 *  subscription, live only while open (`skip` otherwise). */
		bookingId: Id<'bookings'> | null;
		open?: boolean;
		/** Fires on every open/close — the reservations page uses it to drop `?booking=` once
		 *  the host closes a deep-linked sheet. */
		onOpenChange?: (open: boolean) => void;
		onAction?: (booking: typesBookingSafe, action: typesBookingAction) => void;
		/** Override the per-status action set (admin context offers cancel only). */
		getActions?: typeof availableBookingActions;
		/** Host label shown under the property — admin context only. */
		hostName?: string;
	} = $props();

	// The sheet owns its data: the page passes only the id, and this subscription resolves
	// the live row (`fetchBookingByIdSafe`, entitled to host or guest). Live matters — the
	// stay-confirmation panel and the action footer read fields mutations stamp, and this
	// way they update the moment a mutation lands instead of rendering a stale snapshot.
	const bookingQuery = useQuery(
		api.tables.bookings.queries.fetchBookingByIdSafe.fetchBookingByIdSafe,
		() => (open && bookingId ? { bookingId } : 'skip')
	);
	const booking = $derived((bookingQuery.data ?? null) as typesBookingSafe | null);

	function runAction(action: typesBookingAction) {
		if (!booking || !onAction) return;
		onAction(booking, action);
		open = false;
	}
</script>

<NativeSheet
	bind:open
	{onOpenChange}
	side="right"
	title={m['BookingsFeature.BookingsDetailSheet.title']()}
	class="w-full max-w-none gap-0 bg-background sm:max-w-md"
>
	{#if booking}
		<BookingsDetailSheetHeader {booking} />

		<div class="flex-1 overflow-y-auto">
			<div class="flex flex-col gap-5 p-4">
				<BookingsDetailSheetStayInfo {booking} />

				<BookingsDetailSheetPropertyInfo apartment={booking.apartment} {hostName} />

				<!-- `onAction` is the host/admin context: a guest reading their own booking always
				     sees the contact details they typed. -->
				<BookingsDetailSheetGuestContact {booking} hostView={Boolean(onAction)} />

				{#if booking.specialRequests}
					<BookingsDetailSheetSpecialRequests text={booking.specialRequests} />
				{/if}

				<!-- Stay confirmation — host context, cash bookings only: online money already
				     proves intent (BSD §11). -->
				{#if onAction && booking.status === 'confirmed' && booking.paymentMethod === 'cash'}
					<StayConfirmationPanel {booking} />
				{/if}

				<BookingsDetailSheetPriceBreakdown {booking} />

				{#if booking.status === 'cancelled' || booking.status === 'declined' || booking.status === 'auto_declined'}
					<BookingsDetailSheetCancellation {booking} />
				{/if}
			</div>
		</div>

		<BookingsDetailSheetActions
			{booking}
			{getActions}
			onAction={onAction ? runAction : undefined}
		/>
	{/if}
</NativeSheet>
