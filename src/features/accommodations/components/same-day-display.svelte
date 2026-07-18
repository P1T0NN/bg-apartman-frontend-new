<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';

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
		{m['SameDayDisplay.available']()}
	{:else}
		{m['SameDayDisplay.unavailable']()}
	{/if}
</p>
