<script lang="ts">
	// COMPONENTS
	import DataTable from '@/shared/components/ui/data-table/data-table.svelte';
	import BookingsDetailSheet from './bookings-detail-sheet.svelte';
	import { Button } from '@/shared/components/ui/button/index.js';

	// UTILS
	import { cn } from '@/shared/utils/utils.js';
	import {
		BOOKING_FILTERS,
		BOOKING_STATUS_CONFIG,
		PAYMENT_STATUS_CONFIG,
		countByFilter,
		formatCurrency,
		formatDateShort,
		formatNights,
		guestFullName,
		guestInitials,
		matchesFilter,
		matchesSearch
	} from '@/features/bookings/utils/bookingsPresentation';

	// LUCIDE ICONS
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';

	// TYPES
	import type { BookingRecord } from '@/features/bookings/data/bookingsDummyData';
	import type { BookingFilter, BookingAction } from '@/features/bookings/utils/bookingsPresentation';
	import type {
		ColumnDef,
		DataTableCellSnippetProps,
		DataTableSortDirection
	} from '@/shared/components/ui/data-table/types.js';

	let {
		bookings,
		onAction
	}: {
		bookings: BookingRecord[];
		onAction: (booking: BookingRecord, action: BookingAction) => void;
	} = $props();

	const PAGE_SIZE = 8;

	// --- View state -----------------------------------------------------------
	let activeFilter = $state<BookingFilter>('all');
	let search = $state('');
	let page = $state(1);
	let sortColumn = $state<string | undefined>(undefined);
	let sortDirection = $state<DataTableSortDirection | undefined>(undefined);

	let selected = $state<BookingRecord | null>(null);
	let sheetOpen = $state(false);

	function openDetail(booking: BookingRecord) {
		selected = booking;
		sheetOpen = true;
	}

	function setFilter(filter: BookingFilter) {
		activeFilter = filter;
		page = 1;
	}

	// Tint each tab's count chip with its status badge color (e.g. amber for
	// "Requests"/pending) so the number reads as a status notification at a glance.
	function filterChipClass(filter: BookingFilter): string {
		if (filter === 'all') return 'bg-background text-muted-foreground';
		return BOOKING_STATUS_CONFIG[filter].badgeClass;
	}

	// --- Derived data: filter → search → sort → paginate ----------------------
	const counts = $derived(countByFilter(bookings));

	const filtered = $derived(
		bookings.filter((b) => matchesFilter(b, activeFilter) && matchesSearch(b, search))
	);

	const sorted = $derived.by(() => {
		const arr = [...filtered];
		const dir = sortDirection === 'asc' ? 1 : -1;
		if (sortColumn === 'stay') {
			arr.sort((a, b) => a.checkInDate.localeCompare(b.checkInDate) * dir);
		} else if (sortColumn === 'total') {
			arr.sort((a, b) => (a.total - b.total) * dir);
		} else {
			// Default: most recently booked first — a predictable, low-surprise order.
			arr.sort((a, b) => b._creationTime - a._creationTime);
		}
		return arr;
	});

	const totalPages = $derived(Math.max(1, Math.ceil(sorted.length / PAGE_SIZE)));
	const pageRows = $derived(sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE));

	// Keep the page in range when the result set shrinks (filter / search change).
	$effect(() => {
		if (page > totalPages) page = totalPages;
	});

	const columns: ColumnDef<BookingRecord>[] = [
		{ id: 'guest', header: 'Guest', accessor: (r) => guestFullName(r), cellClass: 'min-w-[15rem]', wrap: true },
		{ id: 'apartment', header: 'Property', accessor: (r) => r.apartment.title, hideBelow: 'sm', wrap: true },
		{ id: 'stay', header: 'Stay', accessor: (r) => r.checkInDate, sortable: true, wrap: true },
		{ id: 'guests', header: 'Guests', accessor: (r) => `${r.numberOfAdults + r.numberOfChildren}`, hideBelow: 'lg' },
		{ id: 'status', header: 'Status', accessor: (r) => BOOKING_STATUS_CONFIG[r.status].label, wrap: true },
		{ id: 'payment', header: 'Payment', accessor: (r) => PAYMENT_STATUS_CONFIG[r.paymentStatus].label, hideBelow: 'lg', wrap: true },
		{ id: 'total', header: 'Total', accessor: (r) => r.total, sortable: true },
		{ id: 'actions', header: '', accessor: () => '', hideBelow: 'md', cellClass: 'w-12 text-right' }
	];
</script>

<div class="flex flex-col gap-4">
	<!-- Status filter — the primary way to cut the list down to one workflow stage -->
	<div class="flex flex-wrap items-center gap-1.5">
		{#each BOOKING_FILTERS as filter (filter.value)}
			{@const isActive = activeFilter === filter.value}
			<button
				type="button"
				onclick={() => setFilter(filter.value)}
				aria-pressed={isActive}
				class={cn(
					'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
					isActive
						? 'border-primary bg-primary text-primary-foreground'
						: 'border-transparent bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
				)}
			>
				{filter.label}
				<span
					class={cn(
						'rounded-full px-1.5 text-xs tabular-nums',
						isActive ? 'bg-primary-foreground/20' : filterChipClass(filter.value)
					)}
				>
					{counts[filter.value]}
				</span>
			</button>
		{/each}
	</div>

	<DataTable
		data={pageRows}
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
		bind:sortColumn
		bind:sortDirection
		bind:page
		{totalPages}
		searchable
		bind:search
		searchPlaceholder="Search guest, code or property…"
		hasResult
		borderless
	/>
</div>

<BookingsDetailSheet booking={selected} bind:open={sheetOpen} {onAction} />

{#snippet guestCell({ row }: DataTableCellSnippetProps<BookingRecord>)}
	<button
		type="button"
		onclick={() => openDetail(row)}
		class="group/guest flex w-full items-center gap-3 text-left"
	>
		<span
			class="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground ring-1 ring-border"
			aria-hidden="true"
		>
			{guestInitials(row)}
		</span>
		<span class="min-w-0">
			<span class="block truncate text-sm font-medium group-hover/guest:underline">
				{guestFullName(row)}
			</span>
			<span class="block truncate font-mono text-xs text-muted-foreground">{row.bookingCode}</span>
		</span>
	</button>
{/snippet}

{#snippet apartmentCell({ row }: DataTableCellSnippetProps<BookingRecord>)}
	<div class="flex min-w-0 items-center gap-2.5">
		<img
			src={row.apartment.imageUrl}
			alt={row.apartment.title}
			class="size-9 shrink-0 rounded-md object-cover ring-1 ring-border"
			loading="lazy"
		/>
		<div class="min-w-0">
			<p class="truncate text-sm font-medium">{row.apartment.title}</p>
			<p class="truncate text-xs text-muted-foreground">{row.apartment.city}</p>
		</div>
	</div>
{/snippet}

{#snippet stayCell({ row }: DataTableCellSnippetProps<BookingRecord>)}
	<div class="min-w-0">
		<p class="flex items-center gap-1.5 text-sm font-medium whitespace-nowrap">
			{formatDateShort(row.checkInDate)}
			<ArrowRightIcon class="size-3.5 text-muted-foreground" aria-hidden="true" />
			{formatDateShort(row.checkOutDate)}
		</p>
		<p class="text-xs text-muted-foreground">{formatNights(row.numberOfNights)}</p>
	</div>
{/snippet}

{#snippet guestsCell({ row }: DataTableCellSnippetProps<BookingRecord>)}
	<span class="text-sm text-muted-foreground whitespace-nowrap">
		{row.numberOfAdults + row.numberOfChildren}
		{row.numberOfAdults + row.numberOfChildren === 1 ? 'guest' : 'guests'}
	</span>
{/snippet}

{#snippet statusCell({ row }: DataTableCellSnippetProps<BookingRecord>)}
	<span
		class={cn(
			'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1',
			BOOKING_STATUS_CONFIG[row.status].badgeClass
		)}
	>
		{BOOKING_STATUS_CONFIG[row.status].label}
	</span>
{/snippet}

{#snippet paymentCell({ row }: DataTableCellSnippetProps<BookingRecord>)}
	<span
		class={cn(
			'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1',
			PAYMENT_STATUS_CONFIG[row.paymentStatus].badgeClass
		)}
	>
		{PAYMENT_STATUS_CONFIG[row.paymentStatus].label}
	</span>
{/snippet}

{#snippet totalCell({ row }: DataTableCellSnippetProps<BookingRecord>)}
	<span class="text-sm font-semibold tabular-nums">{formatCurrency(row.total)}</span>
{/snippet}

{#snippet actionsCell({ row }: DataTableCellSnippetProps<BookingRecord>)}
	<Button
		variant="ghost"
		size="icon-sm"
		class="ml-auto text-muted-foreground"
		aria-label={`View booking ${row.bookingCode}`}
		onclick={() => openDetail(row)}
	>
		<ChevronRightIcon />
	</Button>
{/snippet}
