<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';

	// COMPONENTS
	import BookPaymentFieldItem from './book-payment-field-item.svelte';
	
	// DATA
	import {
		PAYMENT_METHOD_OPTIONS,
		type PaymentMethod
	} from '@/features/bookings/data/paymentMethods';

	let {
		paymentMethod = $bindable()
	}: {
		paymentMethod: PaymentMethod;
	} = $props();
</script>

<section class="space-y-4">
	<h2 class="text-lg font-semibold tracking-tight">{m['BookAccommodationPage.BookPaymentField.payment']()}</h2>

	<div class="space-y-3">
		{#each PAYMENT_METHOD_OPTIONS as option (option.value)}
			<BookPaymentFieldItem
				{option}
				selected={paymentMethod === option.value}
				onselect={() => (paymentMethod = option.value as PaymentMethod)}
			/>
		{/each}
	</div>
</section>
