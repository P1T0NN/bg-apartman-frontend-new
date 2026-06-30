<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';

	// COMPONENTS
	import { Separator } from '@/shared/components/ui/separator/index.js';
	import { NumberStepper } from '@/shared/components/ui/increment-decrement-component/index.js';

	// UTILS
	import { formatMaxGuestsAllowed } from '@/utils/formatters';

	let {
		maxGuests,
		adults = $bindable(2),
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
		label={m['BookAccommodationPage.GuestStepper.adults']()}
		hint={m['BookAccommodationPage.GuestStepper.age13']()}
		bind:value={adults}
		min={1}
		incrementDisabled={totalGuests >= maxGuests}
		decrementLabel={m['BookAccommodationPage.GuestStepper.decreaseAdults']()}
		incrementLabel={m['BookAccommodationPage.GuestStepper.increaseAdults']()}
	/>

	<Separator />
	
	<NumberStepper
		label={m['BookAccommodationPage.GuestStepper.children']()}
		hint={m['BookAccommodationPage.GuestStepper.ages212']()}
		bind:value={children}
		min={0}
		incrementDisabled={totalGuests >= maxGuests}
		decrementLabel={m['BookAccommodationPage.GuestStepper.decreaseChildren']()}
		incrementLabel={m['BookAccommodationPage.GuestStepper.increaseChildren']()}
	/>
	<p class="text-xs text-muted-foreground">
		{formatMaxGuestsAllowed(maxGuests)}
	</p>
</div>
