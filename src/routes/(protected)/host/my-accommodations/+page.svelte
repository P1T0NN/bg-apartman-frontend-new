<script lang="ts">
	// I18N
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import MyAccommodationsHeader from '@/components/pages/(protected)/host/my-accommodations/my-accommodations-header.svelte';
	import MyAccommodationsTable from '@/components/pages/(protected)/host/my-accommodations/my-accommodations-table/my-accommodations-table.svelte';
</script>

<SvelteHead
	title={m['HostMyAccommodationsPage.SEO.title']()}
	description={m['HostMyAccommodationsPage.SEO.description']()}
	noIndex
/>

<section class="flex w-full flex-col gap-6 p-4 md:p-6">
	<MyAccommodationsHeader />

	<MyAccommodationsTable />
</section>
