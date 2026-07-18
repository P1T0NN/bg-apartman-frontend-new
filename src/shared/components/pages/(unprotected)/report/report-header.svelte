<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';

	// LUCIDE ICONS
	import MegaphoneIcon from '@lucide/svelte/icons/megaphone';
</script>

<header>
	<div class="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
		<MegaphoneIcon class="size-6" aria-hidden="true" />
	</div>

	<h1 class="mt-5 font-display text-3xl font-medium tracking-tight text-balance text-foreground sm:text-4xl">
		{m['ReportPage.ReportHeader.title']()}
	</h1>

	<p class="mt-3 text-pretty text-muted-foreground">
		{m['ReportPage.ReportHeader.intro']()}
	</p>
</header>
