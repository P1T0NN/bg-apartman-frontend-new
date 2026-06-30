<script lang="ts">
	// CLASSES
	import { BookingsTableClass } from './bookingsTable.svelte.js';

	// COMPONENTS
	import DataTable from '@/shared/components/ui/data-table/data-table.svelte';
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
	import BookingsTableLoading from './loading/bookings-table-loading.svelte';

	// DATA
	import { BOOKING_STATUS_CONFIG, PAYMENT_STATUS_CONFIG } from '@/features/bookings/data/bookingsData';

	// TYPES
	import type {
		typesBookingSafe,
		typesBookingAction
	} from '@/shared/features/booking/types/bookingTypes';
	import type {
		ColumnDef,
		DataTableCellSnippetProps
	} from '@/shared/components/ui/data-table/types.js';

	let {
		bookings,
		onAction,
		isLoading = false
	}: {
		bookings: typesBookingSafe[];
		/** Omitted for read-only views (e.g. guest my-bookings). */
		onAction?: (booking: typesBookingSafe, action: typesBookingAction) => void;
		isLoading?: boolean;
	} = $props();

	const table = new BookingsTableClass(() => bookings);

	function guestName(b: typesBookingSafe): string {
		return `${b.guestFirstName} ${b.guestLastName}`;
	}

	const columns: ColumnDef<typesBookingSafe>[] = [
		{ id: 'guest', header: 'Guest', accessor: (r) => guestName(r), cellClass: 'min-w-[15rem]', wrap: true },
		{ id: 'apartment', header: 'Property', accessor: (r) => r.apartment.title, hideBelow: 'sm', wrap: true },
		{ id: 'stay', header: 'Stay', accessor: (r) => r.checkInDate, sortable: true, wrap: true },
		{ id: 'guests', header: 'Guests', accessor: (r) => `${r.numberOfAdults + r.numberOfChildren}`, hideBelow: 'lg' },
		{ id: 'status', header: 'Status', accessor: (r) => BOOKING_STATUS_CONFIG[r.status].label, wrap: true },
		{ id: 'payment', header: 'Payment', accessor: (r) => PAYMENT_STATUS_CONFIG[r.paymentStatus].label, hideBelow: 'lg', wrap: true },
		{ id: 'total', header: 'Total', accessor: (r) => r.total, sortable: true },
		{ id: 'actions', header: '', accessor: () => '', hideBelow: 'md', cellClass: 'w-12 text-right' }
	];
</script>

{#if isLoading}
	<BookingsTableLoading />
{:else}
	<div class="flex flex-col gap-4">
		<BookingsTableFilters
			activeFilter={table.activeFilter}
			counts={table.counts}
			onFilterChange={table.setFilter}
		/>

		<DataTable
			data={table.pageRows}
			{columns}
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
			bind:sortColumn={table.sortColumn}
			bind:sortDirection={table.sortDirection}
			bind:page={table.page}
			totalPages={table.totalPages}
			searchable
			bind:search={table.search}
			searchPlaceholder="Search guest, code or property…"
			hasResult
			borderless
		/>
	</div>

	<BookingsDetailSheet booking={table.selected} bind:open={table.sheetOpen} {onAction} />
{/if}

{#snippet guestCell({ row }: DataTableCellSnippetProps<typesBookingSafe>)}
	<GuestField booking={row} onSelect={() => table.openDetail(row)} />
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
	<ActionsField booking={row} onSelect={() => table.openDetail(row)} />
{/snippet}
