<script lang="ts">
	// COMPONENTS
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import ReservationsHeader from '@/components/pages/(protected)/host/reservations/reservations-header.svelte';
	import ReservationsTable from '@/components/pages/(protected)/host/reservations/reservations-table.svelte';
</script>

<SvelteHead
	title="Reservations"
	description="Review booking requests, track upcoming stays and manage your guests."
	noIndex
/>

<section class="flex w-full flex-col gap-6 p-4 md:p-6">
	<ReservationsHeader />

	<ReservationsTable />
</section>
