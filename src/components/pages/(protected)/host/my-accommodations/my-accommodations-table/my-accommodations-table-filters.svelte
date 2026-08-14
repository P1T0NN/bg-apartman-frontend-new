<script lang="ts">
	// I18N
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import { NativeSelect } from '@/components/ui/select/index.js';

	// DATA
	import { ACCOMMODATION_STATUS_CONFIG } from '@/features/accommodations/data/accommodationsData';

	// TYPES
	import type { typesAccommodationStatus } from '@/shared/features/accommodation/types/accommodationTypes';

	/**
	 * Filter bar for `/host/my-accommodations` — the host-side twin of the admin listings
	 * filter, same shape: the table owns the value so it can derive `queryArgs`, and the
	 * prop maps 1:1 onto a `fetchMyAccommodations` arg.
	 *
	 * Status is the only facet worth offering a host: it is the question they actually have
	 * ("what's live? what's still in review? what expired?"). Type/city belong to the admin's
	 * platform-wide view, not to someone reading their own shelf.
	 *
	 * Options come from the shared status config, so a new listing status appears here the
	 * moment it is given a presentation — no second list to forget.
	 */
	let {
		status = $bindable<typesAccommodationStatus | undefined>(undefined)
	}: {
		status?: typesAccommodationStatus | undefined;
	} = $props();

	const statusOptions = [
		{ value: '', label: m['HostMyAccommodationsPage.MyAccommodationsTableFilters.anyStatus']() },
		...Object.entries(ACCOMMODATION_STATUS_CONFIG).map(([value, tone]) => ({
			value,
			label: tone.label
		}))
	];
</script>

<NativeSelect
	class="w-40"
	value={status ?? ''}
	onChange={(v) => (status = v === '' ? undefined : (v as typesAccommodationStatus))}
	options={statusOptions}
	ariaLabel={m['HostMyAccommodationsPage.MyAccommodationsTableFilters.filterByStatus']()}
/>

{#if status !== undefined}
	<Button variant="ghost" size="sm" onclick={() => (status = undefined)}>
		{m['HostMyAccommodationsPage.MyAccommodationsTableFilters.clear']()}
	</Button>
{/if}
