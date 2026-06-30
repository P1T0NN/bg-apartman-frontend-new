
// CONFIG
import { PAGINATION_DATA } from '@/shared/config';

// UTILS
import { createTabComponentState } from '@/shared/components/ui/tab-component/tab-component.svelte.js';
import { BOOKING_FILTERS } from '@/features/bookings/data/bookingsData';
import {
	countByFilter,
	matchesFilter,
	matchesSearch
} from '@/features/bookings/utils/bookingsPresentation';

// TYPES
import type { typesBookingSafe, typesBookingFilter } from '@/shared/features/booking/types/bookingTypes';
import type { DataTableSortDirection } from '@/shared/components/ui/data-table/types.js';

/**
 * Reactive view-model for the bookings table: URL-backed status filter, search, sort,
 * pagination and detail-sheet selection. Pass a getter so the derived data tracks the live
 * `bookings` prop. Instantiate inside a component's script (the constructor opens an `$effect`).
 */
export class BookingsTableClass {
	// Real getter is assigned in the constructor; the default keeps the lazy `$derived`
	// initializers below valid (they only read it after construction).
	#getBookings: () => typesBookingSafe[] = () => [];

	// Status filter is URL-backed (?status=confirmed) so the guest dashboard's
	// "upcoming" / "checked out" shortcuts deep-link straight into the right tab.
	#statusFilter = createTabComponentState(() => ({
		tabs: BOOKING_FILTERS,
		queryKey: 'status',
		defaultValue: 'all' as typesBookingFilter,
		options: { history: 'replace', shallow: true, scroll: false, clearOnDefault: true }
	}));

	search = $state('');
	page = $state(1);
	sortColumn = $state<string | undefined>(undefined);
	sortDirection = $state<DataTableSortDirection | undefined>(undefined);
	selected = $state<typesBookingSafe | null>(null);
	sheetOpen = $state(false);

	activeFilter = $derived(this.#statusFilter.state.current);
	counts = $derived(countByFilter(this.#getBookings()));

	#filtered = $derived(
		this.#getBookings().filter(
			(b) => matchesFilter(b, this.activeFilter) && matchesSearch(b, this.search)
		)
	);
	#sorted = $derived.by(() => {
		const arr = [...this.#filtered];
		const dir = this.sortDirection === 'asc' ? 1 : -1;
		if (this.sortColumn === 'stay') {
			arr.sort((a, b) => a.checkInDate.localeCompare(b.checkInDate) * dir);
		} else if (this.sortColumn === 'total') {
			arr.sort((a, b) => (a.total - b.total) * dir);
		} else {
			arr.sort((a, b) => b._creationTime - a._creationTime);
		}
		return arr;
	});

	totalPages = $derived(Math.max(1, Math.ceil(this.#sorted.length / PAGINATION_DATA.DEFAULT_PAGE_SIZE)));
	pageRows = $derived(this.#sorted.slice((this.page - 1) * PAGINATION_DATA.DEFAULT_PAGE_SIZE, this.page * PAGINATION_DATA.DEFAULT_PAGE_SIZE));

	constructor(getBookings: () => typesBookingSafe[]) {
		this.#getBookings = getBookings;
		// Keep the page in range when the result set shrinks (filter / search change).
		$effect(() => {
			if (this.page > this.totalPages) this.page = this.totalPages;
		});
	}

	openDetail = (booking: typesBookingSafe): void => {
		this.selected = booking;
		this.sheetOpen = true;
	};

	setFilter = (filter: typesBookingFilter): void => {
		void this.#statusFilter.state.set(filter, this.#statusFilter.options);
		this.page = 1;
	};
}
