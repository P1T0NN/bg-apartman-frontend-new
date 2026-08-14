<script lang="ts">
	import { m } from '@/paraglide/messages';

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
		{m['AccommodationsFeature.SingleStayDisplay.singleNightStaysAvailable']()}
	{:else}
		{m['AccommodationsFeature.SingleStayDisplay.noSingleNightStays']()}
	{/if}
</p>
