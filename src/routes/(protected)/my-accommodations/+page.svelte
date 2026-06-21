<script lang="ts">
	// COMPONENTS
	import SvelteHead from '@/shared/components/ui/svelte-head/svelte-head.svelte';
	import MyAccommodationsHeader from '@/shared/components/pages/(protected)/my-accommodations/my-accommodations-header.svelte';
	import MyAccommodationsTable from '@/shared/components/pages/(protected)/my-accommodations/my-accommodations-table.svelte';
</script>

<SvelteHead
	title="My accommodations"
	description="Manage your accommodation listings, publishing status and pricing."
	noIndex
/>

<section class="flex w-full flex-col gap-6 p-4 md:p-6">
	<MyAccommodationsHeader />

	<div class="flex flex-col gap-4">
		<div class="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
			<div>
				<h2 class="text-base font-semibold">Listings</h2>
				<p class="text-sm text-muted-foreground">
					Newest listings appear first. Sort by created date when reviewing older drafts.
				</p>
			</div>
		</div>

		<div class="border-y py-3">
			<MyAccommodationsTable />
		</div>
	</div>
</section>
