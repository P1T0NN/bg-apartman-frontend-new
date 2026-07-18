<script lang="ts">
	// COMPONENTS
	import SvelteHead from '@/shared/components/ui/svelte-head/svelte-head.svelte';
	import MyAccommodationsHeader from '@/shared/components/pages/(protected)/host/my-accommodations/my-accommodations-header.svelte';
	import MyAccommodationsTable from '@/shared/components/pages/(protected)/host/my-accommodations/my-accommodations-table.svelte';
</script>

<SvelteHead
	title="My accommodations"
	description="Manage your accommodation accommodations, publishing status and pricing."
	noIndex
/>

<section class="flex w-full flex-col gap-6 p-4 md:p-6">
	<MyAccommodationsHeader />

	<MyAccommodationsTable />
</section>
