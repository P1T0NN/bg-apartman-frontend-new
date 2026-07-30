<script lang="ts">
	// COMPONENTS
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import AdminBookingsTable from '@/components/pages/(protected)/admin/bookings/admin-bookings-table/admin-bookings-table.svelte';
</script>

<SvelteHead />

<section class="flex w-full flex-col gap-4 p-4 md:p-6">
	<header class="flex flex-col gap-1">
		<h1 class="text-2xl font-semibold tracking-tight">Bookings</h1>
		<p class="text-sm text-muted-foreground">Look up a booking and see what happened with it.</p>
	</header>

	<AdminBookingsTable />
</section>
