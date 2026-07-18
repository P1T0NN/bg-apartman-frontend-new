<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';
	import { getLocale } from '@/shared/lib/paraglide/runtime';

	const todayLabel = $derived(
		new Intl.DateTimeFormat(getLocale(), { weekday: 'long', month: 'long', day: 'numeric' }).format(
			new Date()
		)
	);
</script>

<header class="flex flex-col gap-1">
	<h1 class="text-2xl font-semibold tracking-tight md:text-3xl">
		{m['HostDashboardPage.HostDashboardHeader.title']()}
	</h1>
	<p class="text-sm text-muted-foreground">
		{m['HostDashboardPage.HostDashboardHeader.subtitle']()} · {todayLabel}
	</p>
</header>
