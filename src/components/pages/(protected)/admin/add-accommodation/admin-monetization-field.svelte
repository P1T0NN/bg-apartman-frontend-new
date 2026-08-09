<script lang="ts">
	// CONFIG
	import { ACCOMMODATIONS_CONFIG, PAYMENTS_CONFIG } from '@/shared/config';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// LUCIDE ICONS
	import ReceiptEuroIcon from '@lucide/svelte/icons/receipt-euro';
	import PercentIcon from '@lucide/svelte/icons/percent';
	import CheckIcon from '@lucide/svelte/icons/check';

	/**
	 * The "Your plan" cards (ASD §8) — the host's per-listing monetization choice, stated
	 * with real numbers from config. The per-booking card carries its permanence sentence
	 * AND the new-listing escape hatch ON the card, never in a tooltip: an irreversible
	 * choice is stated where it is made. It renders disabled until online payments exist.
	 */
	let {
		value,
		setValue
	}: {
		value: unknown;
		setValue: (next: unknown) => void;
	} = $props();

	const current = $derived(value as string | undefined);

	const { AMOUNT, PERIOD_DAYS } = ACCOMMODATIONS_CONFIG.LISTING_FEE;
	const { PERCENT, MIN_EUROS } = ACCOMMODATIONS_CONFIG.BOOKING_FEE;
	const onlineAvailable = PAYMENTS_CONFIG.PROVIDER !== 'none';

	const options = [
		{
			value: 'listing_fee',
			icon: ReceiptEuroIcon,
			label: `Listing fee — €${AMOUNT} per ${PERIOD_DAYS} days`,
			description:
				'Keep 100% of every booking. Accept cash or online payments. Your listing goes live after review and payment.',
			disabled: false,
			note: undefined as string | undefined
		},
		{
			value: 'booking_fee',
			icon: PercentIcon,
			label: 'Per-booking fee — free to list',
			description:
				`Guests pay a ${PERCENT}% service fee (min €${MIN_EUROS}) on each booking. Online payments only. ` +
				`Permanent: this plan can't be changed later — to use a listing fee instead, you'd create a new listing.`,
			disabled: !onlineAvailable,
			note: onlineAvailable ? undefined : 'Available once online payments launch.'
		}
	];
</script>

<div class="grid gap-3">
	{#each options as option (option.value)}
		{@const active = current === option.value}
		{@const Icon = option.icon}
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
				<Icon class="size-5" />
			</span>

			<span class="min-w-0 flex-1">
				<span class="block text-sm font-medium text-foreground">{option.label}</span>
				<span class="mt-0.5 block text-xs leading-snug text-muted-foreground">
					{option.description}
				</span>
				{#if option.note}
					<span class="mt-1 block text-xs font-medium text-foreground">{option.note}</span>
				{/if}
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
