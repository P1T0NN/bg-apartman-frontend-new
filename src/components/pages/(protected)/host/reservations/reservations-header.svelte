<script lang="ts">
	// I18N
	import { m } from '@/paraglide/messages';

	// A deliberately quiet header — bookings arrive from guests, so there is no
	// primary "create" action competing for attention. The work lives below.
	// Copy is configurable so the guest "My bookings" page can reuse the exact layout.
	let {
		title = m['HostReservationsPage.ReservationsHeader.title'](),
		description = m['HostReservationsPage.ReservationsHeader.description']()
	}: {
		title?: string;
		description?: string;
	} = $props();
</script>

<header class="flex flex-col gap-1 border-b pb-5">
	<h1 class="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
	<p class="max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>
</header>
