<script lang="ts">
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
		label="Adults"
		hint="Age 13+"
		bind:value={adults}
		min={1}
		incrementDisabled={totalGuests >= maxGuests}
		decrementLabel="Decrease adults"
		incrementLabel="Increase adults"
	/>

	<Separator />

	<NumberStepper
		label="Children"
		hint="Ages 2–12"
		bind:value={children}
		min={0}
		incrementDisabled={totalGuests >= maxGuests}
		decrementLabel="Decrease children"
		incrementLabel="Increase children"
	/>
	<p class="text-xs text-muted-foreground">
		{formatMaxGuestsAllowed(maxGuests)}
	</p>
</div>
