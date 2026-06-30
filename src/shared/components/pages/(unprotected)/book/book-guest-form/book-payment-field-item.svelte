<script lang="ts">
	// UTILS
	import { cn } from '@/utils/utils.js';

	// DATA
	import type { PaymentMethod, PaymentMethodOption } from '@/features/bookings/data/paymentMethods';

	// TYPES
	import type { Component } from 'svelte';

	// LUCIDE ICONS
	import BanknoteIcon from '@lucide/svelte/icons/banknote';
	import CreditCardIcon from '@lucide/svelte/icons/credit-card';
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';

	let {
		option,
		selected = false,
		onselect
	}: {
		option: PaymentMethodOption;
		selected?: boolean;
		onselect: () => void;
	} = $props();

	const methodIcons: Record<PaymentMethod, Component> = {
		cash: BanknoteIcon,
		online: CreditCardIcon
	};

	const method = $derived(option.value as PaymentMethod);
	const Icon = $derived(methodIcons[method]);
</script>

<button
	type="button"
	aria-pressed={selected}
	onclick={onselect}
	class={cn(
		'flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors',
		'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none',
		selected
			? 'border-primary bg-primary/5'
			: 'border-border hover:border-input hover:bg-muted/40'
	)}
>
	<Icon
		class={cn('size-5 shrink-0', selected ? 'text-primary' : 'text-muted-foreground')}
		aria-hidden="true"
	/>
	<div class="min-w-0 flex-1">
		<p class="text-sm font-medium">{option.label}</p>
		<p class="text-xs text-muted-foreground">
			{option.description}
		</p>
	</div>
	{#if selected}
		<CircleCheckIcon class="size-5 shrink-0 text-primary" aria-hidden="true" />
	{/if}
</button>
