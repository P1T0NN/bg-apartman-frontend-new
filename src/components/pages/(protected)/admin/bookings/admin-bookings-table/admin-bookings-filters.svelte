<script lang="ts">
	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import { Input } from '@/components/ui/input/index.js';
	import { NativeSelect } from '@/components/ui/select/index.js';

	// DATA
	import {
		BOOKING_STATUS_CONFIG,
		PAYMENT_STATUS_CONFIG
	} from '@/features/bookings/data/bookingsData';

	// TYPES
	import type {
		typesBookingStatus,
		typesPaymentStatus
	} from '@/shared/features/booking/types/bookingTypes';

	/**
	 * Filter bar for `/admin/bookings` (AdminPagesSystemDesign.md §3). Each prop maps 1:1
	 * to a `listBookingsAdmin` arg; the page owns the values so it can derive `queryArgs`.
	 *
	 * Status options come from the shared status configs, so a new booking or payment state
	 * shows up here as soon as it has a presentation — never a hand-kept second list.
	 */
	let {
		searchField = $bindable<'code' | 'email'>('code'),
		status = $bindable<typesBookingStatus | undefined>(undefined),
		paymentStatus = $bindable<typesPaymentStatus | undefined>(undefined),
		checkInFrom = $bindable<string>(''),
		checkInTo = $bindable<string>(''),
		flagged = $bindable<boolean>(false)
	}: {
		searchField?: 'code' | 'email';
		status?: typesBookingStatus | undefined;
		paymentStatus?: typesPaymentStatus | undefined;
		checkInFrom?: string;
		checkInTo?: string;
		flagged?: boolean;
	} = $props();

	const statusOptions = [
		{ value: '', label: 'Any status' },
		...Object.entries(BOOKING_STATUS_CONFIG).map(([value, tone]) => ({
			value,
			label: tone.label
		}))
	];

	const paymentOptions = [
		{ value: '', label: 'Any payment' },
		...Object.entries(PAYMENT_STATUS_CONFIG).map(([value, tone]) => ({
			value,
			label: tone.label
		}))
	];

	const hasActiveFilter = $derived(
		status !== undefined ||
			paymentStatus !== undefined ||
			checkInFrom !== '' ||
			checkInTo !== '' ||
			flagged
	);

	function clearFilters() {
		status = undefined;
		paymentStatus = undefined;
		checkInFrom = '';
		checkInTo = '';
		flagged = false;
	}
</script>

<NativeSelect
	class="w-28"
	value={searchField}
	onChange={(v) => (searchField = (v as 'code' | 'email') || 'code')}
	options={[
		{ value: 'code', label: 'Code' },
		{ value: 'email', label: 'Email' }
	]}
	ariaLabel="Search field"
/>

<NativeSelect
	class="w-36"
	value={status ?? ''}
	onChange={(v) => (status = v === '' ? undefined : (v as typesBookingStatus))}
	options={statusOptions}
	ariaLabel="Filter by booking status"
/>

<NativeSelect
	class="w-40"
	value={paymentStatus ?? ''}
	onChange={(v) => (paymentStatus = v === '' ? undefined : (v as typesPaymentStatus))}
	options={paymentOptions}
	ariaLabel="Filter by payment status"
/>

<!-- Native date inputs: the platform feature beats a picker component for two bounds. -->
<Input
	type="date"
	class="w-40"
	bind:value={checkInFrom}
	aria-label="Check-in from"
	title="Check-in from"
/>
<Input
	type="date"
	class="w-40"
	bind:value={checkInTo}
	aria-label="Check-in to"
	title="Check-in to"
/>

<!--
	The money operations that failed and need a human (PaymentsSystemDesign.md §4/§6).
	A toggle rather than a select: it is the one filter an admin reaches for on purpose,
	and the reconciliation cron keeps re-populating it.
-->
<Button
	variant={flagged ? 'default' : 'outline'}
	size="sm"
	aria-pressed={flagged}
	onclick={() => (flagged = !flagged)}
>
	Needs attention
</Button>

{#if hasActiveFilter}
	<Button variant="ghost" size="sm" onclick={clearFilters}>Clear</Button>
{/if}
