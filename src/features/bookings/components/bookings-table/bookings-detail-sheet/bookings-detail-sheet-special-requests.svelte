<script lang="ts">
	// I18N
	import { m } from '@/lib/paraglide/messages';

	// LUCIDE ICONS
	import SparklesIcon from '@lucide/svelte/icons/sparkles';

	let { text }: { text: string } = $props();
</script>

<section class="space-y-2">
	<h3 class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
		{m['BookingsFeature.BookingsDetailSheet.BookingsDetailSheetSpecialRequests.title']()}
	</h3>

	<div class="flex gap-2.5 rounded-lg border border-dashed bg-muted/20 p-3 text-sm">
		<SparklesIcon class="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
		<p class="leading-relaxed text-foreground/90">{text}</p>
	</div>
</section>
