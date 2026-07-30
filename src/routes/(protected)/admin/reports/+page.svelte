<script lang="ts">
	// COMPONENTS
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import AdminReportsHeader from '@/components/pages/(protected)/admin/reports/admin-reports-header.svelte';
	import AdminReportsTable from '@/components/pages/(protected)/admin/reports/admin-reports-table/admin-reports-table.svelte';
</script>

<SvelteHead />

<section class="flex w-full flex-col gap-4 p-4 md:p-6">
	<AdminReportsHeader />

	<AdminReportsTable />
</section>
