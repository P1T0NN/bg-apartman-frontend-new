<script lang="ts">
	// I18N
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import { Separator } from '@/components/ui/separator/index.js';
	import { NumberStepper } from '@/components/ui/increment-decrement-component/index.js';

	// UTILS
	import { formatMaxGuestsAllowed } from '@/utils/formatters';

	let {
		maxGuests,
		adults = $bindable(1),
		children = $bindable(0)
	}: {
		maxGuests: number;
		adults?: number;
		children?: number;
	} = $props();

	const totalGuests = $derived(adults + children);
</script>

<div class="space-y-4">
	<NumberStepper
		label={m['AccommodationPage.GuestStepper.adults']()}
		hint={m['AccommodationPage.GuestStepper.ageHint']()}
		bind:value={adults}
		min={1}
		incrementDisabled={totalGuests >= maxGuests}
		decrementLabel={m['AccommodationPage.GuestStepper.decreaseAdults']()}
		incrementLabel={m['AccommodationPage.GuestStepper.increaseAdults']()}
	/>

	<Separator />

	<NumberStepper
		label={m['AccommodationPage.GuestStepper.children']()}
		hint={m['AccommodationPage.GuestStepper.agesHint']()}
		bind:value={children}
		min={0}
		incrementDisabled={totalGuests >= maxGuests}
		decrementLabel={m['AccommodationPage.GuestStepper.decreaseChildren']()}
		incrementLabel={m['AccommodationPage.GuestStepper.increaseChildren']()}
	/>
	<p class="text-xs text-muted-foreground">
		{formatMaxGuestsAllowed(maxGuests)}
	</p>
</div>
