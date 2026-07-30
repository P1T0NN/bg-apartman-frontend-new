<script lang="ts">
	const todayLabel = $derived(
		new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(
			new Date()
		)
	);
</script>

<header class="flex flex-col gap-1">
	<h1 class="text-2xl font-semibold tracking-tight md:text-3xl">Dashboard</h1>
	<p class="text-sm text-muted-foreground">
		Your accommodations at a glance. · {todayLabel}
	</p>
</header>
