<script lang="ts">
	// UTILS
	import { cn } from '@/utils/utils.js';

	let {
		enabled,
		class: className
	}: {
		/** Whether same-day check-in is allowed for this accommodation. */
		enabled: boolean;
		class?: string;
	} = $props();
</script>

<p class={cn(className)}>
	{#if enabled}
		Same-day check-in available
	{:else}
		No same-day check-in
	{/if}
</p>
