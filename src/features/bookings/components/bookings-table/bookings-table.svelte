<script lang="ts">
	// COMPONENTS
	import ConvexDataTable from '@/components/ui/data-table/convex-data-table.svelte';
	import BookingsTableFilters from './bookings-table-filters.svelte';
	import GuestField from './guest-field.svelte';
	import ApartmentField from './apartment-field.svelte';
	import StayField from './stay-field.svelte';
	import GuestsField from './guests-field.svelte';
	import StatusField from './status-field.svelte';
	import PaymentField from './payment-field.svelte';
	import TotalField from './total-field.svelte';
	import ActionsField from './actions-field.svelte';

	// UTILS
	import { createTabComponentState } from '@/components/ui/tab-component/tab-component.svelte.js';

	// DATA
	import { BOOKING_FILTERS } from '@/features/bookings/data/bookingsData';
	import { BOOKINGS_TABLE_COLUMNS, EMPTY_COUNTS } from './bookingsTableData';

	// TYPES
	import type { Snippet } from 'svelte';
	import type { FunctionReference } from 'convex/server';
	import type { Id } from '@/convex/_generated/dataModel';
	import type {
		typesBookingSafe,
		typesBookingFilter,
		typesUserBookingsPayload
	} from '@/shared/features/booking/types/bookingTypes';
	import type {
		DataTableCellSnippetProps,
		DataTableSortDirection
	} from '@/components/ui/data-table/types.js';

	let {
		query,
		selectedId = $bindable(null),
		sheetOpen = $bindable(false),
		errorContent,
		defaultFilter = 'all'
	}: {
		/** Scoped list query (host reservations / guest my-bookings) — see `listUserBookingsQuery`.
		 *  One subscription: pages AND the tab counts (`extra.counts`) come from the same payload. */
		query: FunctionReference<'query', 'public', Record<string, unknown>, typesUserBookingsPayload>;
		/** The id of the row a cell picked. The table does NOT render the detail sheet — the page
		 *  does, and the sheet fetches its row with its own by-id subscription, so every opener
		 *  (a row click, a `?booking=` deep link, a calendar cell) writes this same id +
		 *  `sheetOpen` pair instead of mounting a second sheet. */
		selectedId?: Id<'bookings'> | null;
		sheetOpen?: boolean;
		/** Rendered instead of the table when the list query errors (page-specific error card). */
		errorContent?: Snippet;
		/** Tab shown when the URL carries no `?status=`. The host queue opens on the actionable
		 *  slice (HostSystemDesign.md §3); the guest list opens on everything. */
		defaultFilter?: typesBookingFilter;
	} = $props();

	// Status filter is URL-backed (?status=confirmed) so the guest dashboard's
	// "upcoming" / "checked out" shortcuts deep-link straight into the right tab.
	const statusFilter = createTabComponentState(() => ({
		tabs: BOOKING_FILTERS,
		queryKey: 'status',
		defaultValue: defaultFilter,
		options: { history: 'replace', shallow: true, scroll: false, clearOnDefault: true }
	}));
	const activeFilter = $derived(statusFilter.state.current);

	// "all" is expressed by omitting the arg; ConvexDataTable resets to page 1 on args change.
	const listArgs = $derived(activeFilter === 'all' ? {} : { filter: activeFilter });

	// Tab counts ride along in the list payload's `extra` — no second subscription.
	let extra = $state<unknown>(undefined);
	const counts = $derived(
		(extra as typesUserBookingsPayload['extra'] | undefined)?.counts ?? EMPTY_COUNTS
	);

	// Search + sort round-trip to the server through ConvexDataTable's bindable state.
	let search = $state('');
	let sortColumn = $state<string | undefined>(undefined);
	let sortDirection = $state<DataTableSortDirection | undefined>(undefined);

	function setFilter(filter: typesBookingFilter): void {
		void statusFilter.state.set(filter, statusFilter.options);
	}
</script>

<div class="flex flex-col gap-4">
	<BookingsTableFilters {activeFilter} {counts} onFilterChange={setFilter} />

	<ConvexDataTable
		{query}
		queryArgs={listArgs}
		columns={BOOKINGS_TABLE_COLUMNS}
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
		controlsPlace="top"
		searchable
		bind:search
		searchPlaceholder="Search guest, code or property…"
		borderless
		{errorContent}
		bind:extra
	/>
</div>

{#snippet guestCell({ row }: DataTableCellSnippetProps<typesBookingSafe>)}
	<GuestField booking={row} bind:selectedId bind:open={sheetOpen} />
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
	<ActionsField booking={row} bind:selectedId bind:open={sheetOpen} />
{/snippet}
