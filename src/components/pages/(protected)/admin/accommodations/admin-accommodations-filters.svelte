<script lang="ts">
	// I18N
	import { m } from '@/lib/paraglide/messages';

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
		type = $bindable<typesAccommodationType | undefined>(undefined),
		grantedFree = $bindable<boolean | undefined>(undefined)
	}: {
		status?: typesAccommodationStatus | undefined;
		type?: typesAccommodationType | undefined;
		grantedFree?: boolean | undefined;
	} = $props();

	const statusOptions = [
		{ value: '', label: m['AdminAccommodationsPage.AdminAccommodationsFilters.anyStatus']() },
		...Object.entries(ACCOMMODATION_STATUS_CONFIG).map(([value, tone]) => ({
			value,
			label: tone.label
		}))
	];

	const typeOptions = [
		{ value: '', label: m['AdminAccommodationsPage.AdminAccommodationsFilters.anyType']() },
		...ACCOMMODATION_TYPES.map((t) => ({ value: t.value, label: t.label }))
	];

	const grantOptions = [
		{ value: '', label: m['AdminAccommodationsPage.AdminAccommodationsFilters.anyGrant']() },
		{ value: 'granted', label: m['AdminAccommodationsPage.AdminAccommodationsFilters.freeGrantsOnly']() }
	];

	const hasActiveFilter = $derived(
		status !== undefined || type !== undefined || grantedFree !== undefined
	);

	function clearFilters() {
		status = undefined;
		type = undefined;
		grantedFree = undefined;
	}
</script>

<NativeSelect
	class="w-40"
	value={status ?? ''}
	onChange={(v) => (status = v === '' ? undefined : (v as typesAccommodationStatus))}
	options={statusOptions}
	ariaLabel={m['AdminAccommodationsPage.AdminAccommodationsFilters.filterByStatus']()}
/>

<NativeSelect
	class="w-40"
	value={type ?? ''}
	onChange={(v) => (type = v === '' ? undefined : (v as typesAccommodationType))}
	options={typeOptions}
	ariaLabel={m['AdminAccommodationsPage.AdminAccommodationsFilters.filterByType']()}
/>

<NativeSelect
	class="w-40"
	value={grantedFree === true ? 'granted' : ''}
	onChange={(v) => (grantedFree = v === 'granted' ? true : undefined)}
	options={grantOptions}
	ariaLabel={m['AdminAccommodationsPage.AdminAccommodationsFilters.filterByGrant']()}
/>

{#if hasActiveFilter}
	<Button variant="ghost" size="sm" onclick={clearFilters}>
		{m['AdminAccommodationsPage.AdminAccommodationsFilters.clear']()}
	</Button>
{/if}
