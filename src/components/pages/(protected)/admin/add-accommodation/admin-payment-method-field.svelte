<script lang="ts">
	// UTILS
	import { cn } from '@/utils/utils.js';

	// DATA
	import { ACCOMMODATION_PAYMENT_METHOD_OPTIONS } from '@/features/bookings/data/paymentMethods';

	// LUCIDE ICONS
	import BanknoteIcon from '@lucide/svelte/icons/banknote';
	import CheckIcon from '@lucide/svelte/icons/check';

	let {
		value,
		setValue
	}: {
		value: unknown;
		setValue: (next: unknown) => void;
	} = $props();

	const current = $derived(value as string | undefined);
</script>

<div class="grid gap-3">
	{#each ACCOMMODATION_PAYMENT_METHOD_OPTIONS as option (option.value)}
		{@const active = current === option.value}
		<!-- Online options stay visible while the provider is dark, disabled with their own
		     "coming soon" line — same treatment as the per-booking plan card beside them
		     (PaymentsSystemDesign.md §8). -->
		<button
			type="button"
			onclick={() => setValue(option.value)}
			aria-pressed={active}
			disabled={option.disabled}
			class={cn(
				'flex items-start gap-3 rounded-xl border p-4 text-left transition-colors',
				'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none',
				option.disabled && 'cursor-not-allowed opacity-60',
				active
					? 'border-primary bg-primary/5'
					: 'border-border enabled:hover:border-input enabled:hover:bg-muted/40'
			)}
		>
			<span
				class={cn(
					'flex size-10 shrink-0 items-center justify-center rounded-lg transition-colors',
					active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
				)}
			>
				<BanknoteIcon class="size-5" />
			</span>

			<span class="min-w-0 flex-1">
				<span class="block text-sm font-medium text-foreground">{option.label}</span>
				<span class="mt-0.5 block text-xs leading-snug text-muted-foreground">
					{option.description}
				</span>
			</span>

			<span
				class={cn(
					'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors',
					active ? 'border-primary bg-primary text-primary-foreground' : 'border-input'
				)}
			>
				{#if active}
					<CheckIcon class="size-3.5" />
				{/if}
			</span>
		</button>
	{/each}
</div>
