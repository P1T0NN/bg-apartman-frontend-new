<script lang="ts">
	// TYPES
	import type { AdminDashboardPage } from '@/convex/pages/admin/dashboard/types/adminDashboardTypes';

	/**
	 * Band 2 — today's pulse. One sentence-shaped row of four facts, not four stat cards:
	 * these are ephemeral numbers an admin glances at, and cards would visually outrank
	 * Band 1 (AdminDashboardPageSystemDesign.md §2). Zeros still render — a pulse row with
	 * missing entries reads as broken, not as calm.
	 */
	let { data }: { data: AdminDashboardPage['today'] } = $props();

	const facts = $derived([
		{ value: data.signups, label: data.signups === 1 ? 'new signup' : 'new signups' },
		{
			value: data.bookingsCreated,
			label: data.bookingsCreated === 1 ? 'booking created' : 'bookings created'
		},
		{ value: data.checkIns, label: data.checkIns === 1 ? 'check-in' : 'check-ins' },
		{
			value: data.pendingOpen,
			label: data.pendingOpen === 1 ? 'pending request open' : 'pending requests open'
		}
	]);
</script>

<section class="flex flex-col gap-2">
	<h2 class="text-[0.6875rem] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
		Today
	</h2>

	<p class="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm text-muted-foreground">
		{#each facts as fact, i (fact.label)}
			{#if i > 0}
				<span aria-hidden="true">·</span>
			{/if}
			<span class="whitespace-nowrap">
				<span class="font-semibold text-foreground tabular-nums">{fact.value}</span>
				{fact.label}
			</span>
		{/each}
	</p>
</section>
