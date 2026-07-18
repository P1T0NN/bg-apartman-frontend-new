<script lang="ts">
	// COMPONENTS
	import ConvexDataTable from '@/shared/components/ui/data-table/convex-data-table.svelte';
	import BookingsDetailSheet from './bookings-detail-sheet.svelte';
	import BookingsTableFilters from './bookings-table-filters.svelte';
	import GuestField from './guest-field.svelte';
	import ApartmentField from './apartment-field.svelte';
	import StayField from './stay-field.svelte';
	import GuestsField from './guests-field.svelte';
	import StatusField from './status-field.svelte';
	import PaymentField from './payment-field.svelte';
	import TotalField from './total-field.svelte';
	import ActionsField from './actions-field.svelte';

	// DATA
	import {
		BOOKING_FILTERS,
		BOOKING_STATUS_CONFIG,
		PAYMENT_STATUS_CONFIG
	} from '@/features/bookings/data/bookingsData';

	// UTILS
	import { createTabComponentState } from '@/shared/components/ui/tab-component/tab-component.svelte.js';

	// TYPES
	import type { Snippet } from 'svelte';
	import type { FunctionReference } from 'convex/server';
	import type {
		BookingFilterCounts,
		UserBookingsPayload
	} from '@/convex/tables/bookings/helpers/listUserBookings';
	import type {
		typesBookingSafe,
		typesBookingAction,
		typesBookingFilter
	} from '@/shared/features/booking/types/bookingTypes';
	import type {
		ColumnDef,
		DataTableCellSnippetProps,
		DataTableSortDirection
	} from '@/shared/components/ui/data-table/types.js';

	let {
		query,
		onAction,
		errorContent
	}: {
		/** Scoped list query (host reservations / guest my-bookings) — see `listUserBookingsQuery`.
		 *  One subscription: pages AND the tab counts (`extra.counts`) come from the same payload. */
		query: FunctionReference<'query', 'public', Record<string, unknown>, UserBookingsPayload>;
		/** Omitted for read-only views (e.g. guest my-bookings). */
		onAction?: (booking: typesBookingSafe, action: typesBookingAction) => void;
		/** Rendered instead of the table when the list query errors (page-specific error card). */
		errorContent?: Snippet;
	} = $props();

	// Status filter is URL-backed (?status=confirmed) so the guest dashboard's
	// "upcoming" / "checked out" shortcuts deep-link straight into the right tab.
	const statusFilter = createTabComponentState(() => ({
		tabs: BOOKING_FILTERS,
		queryKey: 'status',
		defaultValue: 'all' as typesBookingFilter,
		options: { history: 'replace', shallow: true, scroll: false, clearOnDefault: true }
	}));
	const activeFilter = $derived(statusFilter.state.current);

	function setFilter(filter: typesBookingFilter): void {
		void statusFilter.state.set(filter, statusFilter.options);
	}

	// "all" is expressed by omitting the arg; ConvexDataTable resets to page 1 on args change.
	const listArgs = $derived(activeFilter === 'all' ? {} : { filter: activeFilter });

	// Tab counts ride along in the list payload's `extra` — no second subscription.
	let extra = $state<unknown>(undefined);
	const EMPTY_COUNTS: BookingFilterCounts = {
		all: 0,
		pending: 0,
		confirmed: 0,
		checked_in: 0,
		checked_out: 0,
		declined: 0,
		auto_declined: 0,
		cancelled: 0
	};
	const counts = $derived(
		(extra as UserBookingsPayload['extra'] | undefined)?.counts ?? EMPTY_COUNTS
	);

	// Search + sort round-trip to the server through ConvexDataTable's bindable state.
	let search = $state('');
	let sortColumn = $state<string | undefined>(undefined);
	let sortDirection = $state<DataTableSortDirection | undefined>(undefined);

	// Detail-sheet selection.
	let selected = $state<typesBookingSafe | null>(null);
	let sheetOpen = $state(false);

	function openDetail(booking: typesBookingSafe): void {
		selected = booking;
		sheetOpen = true;
	}

	function guestName(b: typesBookingSafe): string {
		return `${b.guestFirstName} ${b.guestLastName}`;
	}

	const columns: ColumnDef<typesBookingSafe>[] = [
		{
			id: 'guest',
			header: 'Guest',
			accessor: (r) => guestName(r),
			cellClass: 'min-w-[15rem]',
			wrap: true
		},
		{
			id: 'apartment',
			header: 'Property',
			accessor: (r) => r.apartment.title,
			hideBelow: 'sm',
			wrap: true
		},
		{ id: 'stay', header: 'Stay', accessor: (r) => r.checkInDate, sortable: true, wrap: true },
		{
			id: 'guests',
			header: 'Guests',
			accessor: (r) => `${r.numberOfAdults + r.numberOfChildren}`,
			hideBelow: 'lg'
		},
		{
			id: 'status',
			header: 'Status',
			accessor: (r) => BOOKING_STATUS_CONFIG[r.status].label,
			wrap: true
		},
		{
			id: 'payment',
			header: 'Payment',
			accessor: (r) => PAYMENT_STATUS_CONFIG[r.paymentStatus].label,
			hideBelow: 'lg',
			wrap: true
		},
		{ id: 'total', header: 'Total', accessor: (r) => r.total, sortable: true },
		{ id: 'actions', header: '', accessor: () => '', hideBelow: 'md', cellClass: 'w-12 text-right' }
	];
</script>

<div class="flex flex-col gap-4">
	<BookingsTableFilters {activeFilter} {counts} onFilterChange={setFilter} />

	<ConvexDataTable
		{query}
		queryArgs={listArgs}
		{columns}
		optimizationStrategy="offset"
		getRowId={(row) => row._id}
		customCells={{
			guest: guestCell,
			apartment: apartmentCell,
			stay: stayCell,
			guests: guestsCell,
			status: statusCell,
			payment: paymentCell,
			total: totalCell,
			actions: actionsCell
		}}
		bind:sortColumn
		bind:sortDirection
		searchable
		bind:search
		searchPlaceholder="Search guest, code or property…"
		borderless
		{errorContent}
		bind:extra
	/>
</div>

<BookingsDetailSheet booking={selected} bind:open={sheetOpen} {onAction} />

{#snippet guestCell({ row }: DataTableCellSnippetProps<typesBookingSafe>)}
	<GuestField booking={row} onSelect={() => openDetail(row)} />
{/snippet}

{#snippet apartmentCell({ row }: DataTableCellSnippetProps<typesBookingSafe>)}
	<ApartmentField booking={row} />
{/snippet}

{#snippet stayCell({ row }: DataTableCellSnippetProps<typesBookingSafe>)}
	<StayField booking={row} />
{/snippet}

{#snippet guestsCell({ row }: DataTableCellSnippetProps<typesBookingSafe>)}
	<GuestsField booking={row} />
{/snippet}

{#snippet statusCell({ row }: DataTableCellSnippetProps<typesBookingSafe>)}
	<StatusField booking={row} />
{/snippet}

{#snippet paymentCell({ row }: DataTableCellSnippetProps<typesBookingSafe>)}
	<PaymentField booking={row} />
{/snippet}

{#snippet totalCell({ row }: DataTableCellSnippetProps<typesBookingSafe>)}
	<TotalField booking={row} />
{/snippet}

{#snippet actionsCell({ row }: DataTableCellSnippetProps<typesBookingSafe>)}
	<ActionsField booking={row} onSelect={() => openDetail(row)} />
{/snippet}
