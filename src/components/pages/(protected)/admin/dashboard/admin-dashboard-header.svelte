<script lang="ts">
	// I18N
	import { m } from '@/paraglide/messages';
</script>

<header class="flex flex-col gap-1">
	<h1 class="text-2xl font-semibold tracking-tight">{m['AdminDashboardPage.AdminDashboardHeader.dashboard']()}</h1>
	<p class="text-sm text-muted-foreground">
		{m['AdminDashboardPage.AdminDashboardHeader.platformOverview']()}
	</p>
</header>
