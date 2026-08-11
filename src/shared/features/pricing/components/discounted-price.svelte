<script lang="ts">
	// UTILS
	import { formatCurrency } from '@/utils/formatters';
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { ClassValue } from 'clsx';

	let {
		original,
		price,
		strikeFirst = true,
		class: className
	}: {
		/** Pre-discount price; when set the current price reads as a deal (emerald) with it struck. */
		original?: number | null;
		/** The price the guest actually pays. */
		price: number;
		/** Strike the original before (card style) or after (booking-panel style) the current price. */
		strikeFirst?: boolean;
		class?: ClassValue;
	} = $props();
</script>

{#if original && strikeFirst}
	<span class="text-destructive line-through">{formatCurrency(original)}</span>
{/if}
<span
	class={cn('font-semibold', original && 'text-emerald-700 dark:text-emerald-300', className)}
	>{formatCurrency(price)}</span
>
{#if original && !strikeFirst}
	<span class="text-destructive line-through">{formatCurrency(original)}</span>
{/if}
