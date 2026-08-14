<script lang="ts">
	// I18N
	import { m } from '@/lib/paraglide/messages';
</script>

<header class="flex flex-col gap-1 border-b pb-5">
	<h1 class="text-2xl font-semibold tracking-tight md:text-3xl">
		{m['GuestMyBookingsPage.MyBookingsHeader.myBookings']()}
	</h1>
	<p class="max-w-2xl text-sm leading-relaxed text-muted-foreground">
		{m['GuestMyBookingsPage.MyBookingsHeader.trackYourUpcoming']()}
	</p>
</header>
