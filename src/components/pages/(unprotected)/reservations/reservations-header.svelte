<script lang="ts">
	// I18N
	import { m } from '@/paraglide/messages';

	// LUCIDE ICONS
	import TicketIcon from '@lucide/svelte/icons/ticket';
</script>

<header>
	<div class="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
		<TicketIcon class="size-6" aria-hidden="true" />
	</div>

	<h1
		class="mt-5 font-display text-3xl font-medium tracking-tight text-balance text-foreground sm:text-4xl"
	>
		{m['ReservationsPage.ReservationsHeader.findYourReservation']()}
	</h1>

	<p class="mt-3 text-pretty text-muted-foreground">
		{m['ReservationsPage.ReservationsHeader.lostEmail']()}
	</p>
</header>
