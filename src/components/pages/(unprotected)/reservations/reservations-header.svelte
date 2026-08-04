<script lang="ts">
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
		Find your reservation
	</h1>

	<p class="mt-3 text-pretty text-muted-foreground">
		Lost the email? Enter your booking code and the email you booked with, and we'll take you
		straight to your reservation.
	</p>
</header>
