<script lang="ts">
	// COMPONENTS
	import { Button } from '@/shared/components/ui/button/index.js';

	// LUCIDE ICONS
	import MinusIcon from '@lucide/svelte/icons/minus';
	import PlusIcon from '@lucide/svelte/icons/plus';

	let {
		value = $bindable(0),
		min = Number.NEGATIVE_INFINITY,
		max = Number.POSITIVE_INFINITY,
		step = 1,
		label,
		hint,
		decrementDisabled = false,
		incrementDisabled = false,
		decrementLabel,
		incrementLabel
	}: {
		/** Current numeric value. Two-way bindable. */
		value?: number;
		/** Lowest value the control may reach. */
		min?: number;
		/** Highest value the control may reach. */
		max?: number;
		/** Amount added/removed per click. */
		step?: number;
		/** Optional title shown on the left. */
		label?: string;
		/** Optional helper text shown under the label. */
		hint?: string;
		/** Force-disable the decrement button (e.g. for cross-field limits). */
		decrementDisabled?: boolean;
		/** Force-disable the increment button (e.g. for cross-field limits). */
		incrementDisabled?: boolean;
		/** Accessible label for the decrement button. */
		decrementLabel?: string;
		/** Accessible label for the increment button. */
		incrementLabel?: string;
	} = $props();

	const canDecrement = $derived(!decrementDisabled && value - step >= min);
	const canIncrement = $derived(!incrementDisabled && value + step <= max);

	function decrement() {
		if (canDecrement) value -= step;
	}

	function increment() {
		if (canIncrement) value += step;
	}
</script>

<div class="flex items-center justify-between gap-4">
	{#if label || hint}
		<div>
			{#if label}<p class="text-sm font-medium">{label}</p>{/if}
			{#if hint}<p class="text-xs text-muted-foreground">{hint}</p>{/if}
		</div>
	{/if}

	<div class="flex items-center gap-3">
		<Button
			variant="outline"
			size="icon-sm"
			class="rounded-full"
			disabled={!canDecrement}
			onclick={decrement}
			aria-label={decrementLabel ?? (label ? `Decrease ${label}` : 'Decrease')}
		>
			<MinusIcon />
		</Button>

		<span class="w-4 text-center text-sm tabular-nums">{value}</span>

		<Button
			variant="outline"
			size="icon-sm"
			class="rounded-full"
			disabled={!canIncrement}
			onclick={increment}
			aria-label={incrementLabel ?? (label ? `Increase ${label}` : 'Increase')}
		>
			<PlusIcon />
		</Button>
	</div>
</div>
