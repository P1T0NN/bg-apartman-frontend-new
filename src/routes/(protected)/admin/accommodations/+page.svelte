<script lang="ts">
	// COMPONENTS
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import AdminAccommodationsHeader from '@/components/pages/(protected)/admin/accommodations/admin-accommodations-header.svelte';
	import AdminAccommodationsTable from '@/components/pages/(protected)/admin/accommodations/admin-accommodations-table/admin-accommodations-table.svelte';
</script>

<SvelteHead />

<section class="flex w-full flex-col gap-4 p-4 md:p-6">
	<AdminAccommodationsHeader />

	<AdminAccommodationsTable />
</section>
