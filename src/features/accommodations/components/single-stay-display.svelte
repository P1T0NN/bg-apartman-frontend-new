<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';

	// UTILS
	import { cn } from '@/utils/utils.js';

	let {
		allowed,
		class: className
	}: {
		/** Whether single-night stays are allowed (effective minimum stay is one night or less). */
		allowed: boolean;
		class?: string;
	} = $props();
</script>

<p class={cn(className)}>
	{#if allowed}
		{m['SingleStayDisplay.available']()}
	{:else}
		{m['SingleStayDisplay.unavailable']()}
	{/if}
</p>
