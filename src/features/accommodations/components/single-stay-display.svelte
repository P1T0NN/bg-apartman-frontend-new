<script lang="ts">
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
		Single-night stays available
	{:else}
		No single-night stays
	{/if}
</p>
