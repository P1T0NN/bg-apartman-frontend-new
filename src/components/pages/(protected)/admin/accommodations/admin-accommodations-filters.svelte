<script lang="ts">
	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import { NativeSelect } from '@/components/ui/select/index.js';

	// DATA
	import { ACCOMMODATION_TYPES } from '@/shared/data/accommodationsData';
	import { ACCOMMODATION_STATUS_CONFIG } from '@/features/accommodations/data/accommodationsData';

	// TYPES
	import type {
		typesAccommodationStatus,
		typesAccommodationType
	} from '@/shared/features/accommodation/types/accommodationTypes';

	/**
	 * Filter bar for `/admin/accommodations`. Same shape as the users page: the page owns
	 * the values so it can derive `queryArgs`, and each prop maps 1:1 to a
	 * `listAccommodationsAdmin` arg.
	 *
	 * Status options are derived from the shared status config, so a new listing status
	 * appears here the moment it is given a presentation — no second list to forget.
	 */
	let {
		status = $bindable<typesAccommodationStatus | undefined>(undefined),
		type = $bindable<typesAccommodationType | undefined>(undefined)
	}: {
		status?: typesAccommodationStatus | undefined;
		type?: typesAccommodationType | undefined;
	} = $props();

	const statusOptions = [
		{ value: '', label: 'Any status' },
		...Object.entries(ACCOMMODATION_STATUS_CONFIG).map(([value, tone]) => ({
			value,
			label: tone.label
		}))
	];

	const typeOptions = [
		{ value: '', label: 'Any type' },
		...ACCOMMODATION_TYPES.map((t) => ({ value: t.value, label: t.label }))
	];

	const hasActiveFilter = $derived(status !== undefined || type !== undefined);

	function clearFilters() {
		status = undefined;
		type = undefined;
	}
</script>

<NativeSelect
	class="w-40"
	value={status ?? ''}
	onChange={(v) => (status = v === '' ? undefined : (v as typesAccommodationStatus))}
	options={statusOptions}
	ariaLabel="Filter by status"
/>

<NativeSelect
	class="w-40"
	value={type ?? ''}
	onChange={(v) => (type = v === '' ? undefined : (v as typesAccommodationType))}
	options={typeOptions}
	ariaLabel="Filter by type"
/>

{#if hasActiveFilter}
	<Button variant="ghost" size="sm" onclick={clearFilters}>Clear</Button>
{/if}
