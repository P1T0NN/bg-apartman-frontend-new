<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';

	// COMPONENTS
	import BookPaymentFieldItem from './book-payment-field-item.svelte';

	// DATA
	import { PAYMENT_METHOD_OPTIONS } from '@/features/bookings/data/paymentMethods';

	// TYPES
	import type { Doc } from '@/convex/_generated/dataModel';

	type PaymentMethod = Doc<'bookings'>['paymentMethod'];
	type AcceptedPaymentMethod = NonNullable<Doc<'apartments'>['paymentMethod']>;

	let {
		paymentMethod = $bindable(),
		accepted = 'both'
	}: {
		paymentMethod: PaymentMethod;
		/** What the accommodation accepts — `both` shows the guest a choice, otherwise the single method. */
		accepted?: AcceptedPaymentMethod;
	} = $props();

	const options = $derived(
		accepted === 'both'
			? PAYMENT_METHOD_OPTIONS
			: PAYMENT_METHOD_OPTIONS.filter((option) => option.value === accepted)
	);
</script>

<section class="space-y-4">
	<h2 class="text-lg font-semibold tracking-tight">
		{m['BookAccommodationPage.BookPaymentField.payment']()}
	</h2>

	<div class="space-y-3">
		{#each options as option (option.value)}
			<BookPaymentFieldItem
				{option}
				selected={paymentMethod === option.value}
				onselect={() => (paymentMethod = option.value as PaymentMethod)}
			/>
		{/each}
	</div>
</section>
