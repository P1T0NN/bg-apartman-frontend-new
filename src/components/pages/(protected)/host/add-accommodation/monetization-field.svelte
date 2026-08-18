<script lang="ts">
	// I18N
	import { m } from '@/lib/paraglide/messages';

	// CONFIG
	import { ACCOMMODATIONS_CONFIG, ONLINE_PAYMENTS_AVAILABLE } from '@/shared/config';

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
	const onlineAvailable = ONLINE_PAYMENTS_AVAILABLE;

	const options = [
		{
			value: 'listing_fee',
			icon: ReceiptEuroIcon,
			label: m['HostAddAccommodationPage.MonetizationField.listingFeeLabel']({
				amount: AMOUNT,
				periodDays: PERIOD_DAYS
			}),
			description: m['HostAddAccommodationPage.MonetizationField.listingFeeDescription'](),
			disabled: false,
			note: undefined as string | undefined
		},
		{
			value: 'booking_fee',
			icon: PercentIcon,
			label: m['HostAddAccommodationPage.MonetizationField.bookingFeeLabel'](),
			description: m['HostAddAccommodationPage.MonetizationField.bookingFeeDescription']({
				percent: PERCENT,
				minEuros: MIN_EUROS
			}),
			disabled: !onlineAvailable,
			note: onlineAvailable
				? undefined
				: m['HostAddAccommodationPage.MonetizationField.bookingFeeNote']()
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
