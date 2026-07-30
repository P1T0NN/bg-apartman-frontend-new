<script lang="ts">
	// SVELTEKIT
	import { page } from '$app/state';

	// LIBRARIES
	import { api } from '@/convex/_generated/api';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/config/routeEndpoints';

	// COMPONENTS
	import ConvexDataTable from '@/components/ui/data-table/convex-data-table.svelte';
	import { FeatureStatus } from '@/components/ui/feature-status/index.js';
	import BookingsFilters from './admin-bookings-filters.svelte';
	import BookingDetailRow from './admin-booking-detail-row.svelte';
	import AdminCancelBookingDialog from './admin-cancel-booking-dialog.svelte';

	// DATA
	import {
		BOOKING_STATUS_CONFIG,
		PAYMENT_STATUS_CONFIG
	} from '@/features/bookings/data/bookingsData';

	// UTILS
	import { formatCurrency } from '@/utils/formatters';
	import { appHref } from '@/utils/app-navigation';

	// TYPES
	import type { ColumnDef, DataTableCellSnippetProps } from '@/components/ui/data-table/types.js';
	import type { AdminBookingRow } from '@/convex/tables/bookings/queries/listBookingsAdmin';
	import type {
		typesBookingStatus,
		typesPaymentStatus
	} from '@/shared/features/booking/types/bookingTypes';

	// LUCIDE ICONS
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';

	/**
	 * The whole bookings surface: filters, table, row detail, and the cancel dialog the detail
	 * row opens. Self-contained so the page file stays a header plus this — every piece of
	 * state below (search field, filters, cancel target) exists only to serve this table, and
	 * lifting any of it to the page would just be passing it straight back down.
	 *
	 * Subscription via `ConvexDataTable` — decided in AdminPagesSystemDesign.md §3, not here.
	 */

	// `guestId` arrives from the user-detail page's "View bookings" cross-link (APSD §5).
	const guestId = $derived(page.url.searchParams.get('guestId') ?? undefined);

	let searchField = $state<'code' | 'email'>('code');
	let status = $state<typesBookingStatus | undefined>(undefined);
	let paymentStatus = $state<typesPaymentStatus | undefined>(undefined);
	let checkInFrom = $state('');
	let checkInTo = $state('');
	let flagged = $state(false);
	let search = $state('');

	const queryArgs = $derived({
		searchField,
		...(status !== undefined && { status }),
		...(paymentStatus !== undefined && { paymentStatus }),
		...(checkInFrom !== '' && { checkInFrom }),
		...(checkInTo !== '' && { checkInTo }),
		...(flagged ? { flagged: true } : {}),
		...(guestId !== undefined && { guestId })
	});

	let cancelTarget = $state<AdminBookingRow | null>(null);
	let cancelOpen = $state(false);

	function openCancel(row: AdminBookingRow) {
		cancelTarget = row;
		cancelOpen = true;
	}

	const columns: ColumnDef<AdminBookingRow>[] = [
		{ id: 'bookingCode', header: 'Code', accessor: (r) => r.bookingCode, hasCopy: true },
		{ id: 'guest', header: 'Guest', accessor: (r) => `${r.guestFirstName} ${r.guestLastName}` },
		{
			id: 'accommodation',
			header: 'Accommodation',
			accessor: (r) => r.apartment.title,
			hideBelow: 'md'
		},
		{ id: 'host', header: 'Host', accessor: (r) => r.hostName, hideBelow: 'md' },
		{
			id: 'stay',
			header: 'Stay',
			accessor: (r) => `${r.checkInDate} → ${r.checkOutDate}`,
			hideBelow: 'lg'
		},
		{ id: 'total', header: 'Total', accessor: (r) => r.total, hideBelow: 'lg' },
		{
			id: 'payment',
			header: 'Payment',
			accessor: (r) => r.paymentStatus,
			hideBelow: 'md',
			wrap: true
		},
		{ id: 'status', header: 'Status', accessor: (r) => r.status, wrap: true }
	];
</script>

<!-- `listBookingsAdmin` slices by `page` and returns an exact `totalCount` — it must be
     driven in OFFSET mode. Left on the cursor default it never receives `page` (so every
     page returns the first slice) and `isDone` never lands, so Next stays enabled forever. -->
<ConvexDataTable
	caption="Bookings"
	query={api.tables.bookings.queries.listBookingsAdmin.listBookingsAdmin}
	optimizationStrategy="offset"
	controlsPlace="top"
	{queryArgs}
	{columns}
	getRowId={(r) => r._id}
	getRowLabel={(r) => r.bookingCode}
	customCells={{
		guest: guestCell,
		accommodation: accommodationCell,
		total: totalCell,
		payment: paymentCell,
		status: statusCell
	}}
	{expandedContent}
	searchable
	bind:search
	searchPlaceholder={searchField === 'code' ? 'Search by booking code…' : 'Search by guest email…'}
	{filters}
/>

<AdminCancelBookingDialog booking={cancelTarget} bind:open={cancelOpen} />

{#snippet filters()}
	<BookingsFilters
		bind:searchField
		bind:status
		bind:paymentStatus
		bind:checkInFrom
		bind:checkInTo
		bind:flagged
	/>
{/snippet}

{#snippet guestCell({ row }: DataTableCellSnippetProps<AdminBookingRow>)}
	<div class="flex min-w-0 flex-col">
		<span class="flex items-center gap-1.5 truncate font-medium">
			{row.guestFirstName}
			{row.guestLastName}
			{#if row.paymentFlag}
				<TriangleAlertIcon
					class="size-3.5 shrink-0 text-amber-600 dark:text-amber-400"
					aria-label="A payment operation needs attention"
				/>
			{/if}
		</span>
		<span class="truncate text-xs text-muted-foreground">{row.guestEmail}</span>
	</div>
{/snippet}

{#snippet accommodationCell({ row }: DataTableCellSnippetProps<AdminBookingRow>)}
	<a
		href={appHref(UNPROTECTED_PAGE_ENDPOINTS.ACCOMMODATION.replace(':slug', row.apartmentSlug))}
		class="truncate text-primary hover:underline"
	>
		{row.apartment.title}
	</a>
{/snippet}

{#snippet totalCell({ row }: DataTableCellSnippetProps<AdminBookingRow>)}
	<span class="tabular-nums">{formatCurrency(row.total)}</span>
{/snippet}

{#snippet paymentCell({ row }: DataTableCellSnippetProps<AdminBookingRow>)}
	<FeatureStatus config={PAYMENT_STATUS_CONFIG} status={row.paymentStatus} />
{/snippet}

{#snippet statusCell({ row }: DataTableCellSnippetProps<AdminBookingRow>)}
	<FeatureStatus config={BOOKING_STATUS_CONFIG} status={row.status} />
{/snippet}

{#snippet expandedContent({ row }: { row: AdminBookingRow })}
	<BookingDetailRow booking={row} onCancel={openCancel} />
{/snippet}
