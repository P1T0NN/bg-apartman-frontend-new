<script lang="ts" module>
	export type GuestDetails = {
		firstName: string;
		lastName: string;
		email: string;
		phone: string;
		specialRequests?: string;
	};
</script>

<script lang="ts">
	// COMPONENTS
	import { Field, FieldLabel, FieldError } from '@/shared/components/ui/field/index.js';
	import { Input } from '@/shared/components/ui/input/index.js';
	import { Textarea } from '@/shared/components/ui/textarea/index.js';
	import { Button } from '@/shared/components/ui/button/index.js';

	// LUCIDE ICONS
	import BanknoteIcon from '@lucide/svelte/icons/banknote';
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';

	// TYPES
	import type { AccommodationDetail } from '@/features/accommodations/data/accommodationDummyData';

	let {
		accommodation,
		disabled = false,
		onConfirm
	}: {
		accommodation: AccommodationDetail;
		/** True when dates are missing — keeps the user from confirming an incomplete trip. */
		disabled?: boolean;
		onConfirm: (details: GuestDetails) => void;
	} = $props();

	let firstName = $state('');
	let lastName = $state('');
	let email = $state('');
	let phone = $state('');
	let specialRequests = $state('');
	let attempted = $state(false);

	const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	const errors = $derived({
		firstName: firstName.trim() ? '' : 'Enter your first name',
		lastName: lastName.trim() ? '' : 'Enter your last name',
		email: !email.trim() ? 'Enter your email' : emailRe.test(email.trim()) ? '' : 'Enter a valid email',
		phone: phone.replace(/\D/g, '').length >= 6 ? '' : 'Enter a valid phone number'
	});

	const isValid = $derived(Object.values(errors).every((e) => !e));

	type FieldName = keyof typeof errors;
	function fieldError(name: FieldName): { message: string }[] | undefined {
		return attempted && errors[name] ? [{ message: errors[name] }] : undefined;
	}

	const confirmLabel = $derived(accommodation.instantBooking ? 'Confirm reservation' : 'Request to book');

	function submit(event: SubmitEvent) {
		event.preventDefault();
		attempted = true;
		if (disabled || !isValid) return;
		onConfirm({
			firstName: firstName.trim(),
			lastName: lastName.trim(),
			email: email.trim(),
			phone: phone.trim(),
			specialRequests: specialRequests.trim() || undefined
		});
	}
</script>

<form class="space-y-8" onsubmit={submit} novalidate>
	<!-- Guest details -->
	<section class="space-y-4">
		<h2 class="text-lg font-semibold tracking-tight">Your details</h2>

		<div class="grid gap-4 sm:grid-cols-2">
			<Field>
				<FieldLabel for="firstName">First name</FieldLabel>
				<Input
					id="firstName"
					autocomplete="given-name"
					bind:value={firstName}
					aria-invalid={attempted && !!errors.firstName}
				/>
				<FieldError errors={fieldError('firstName')} />
			</Field>

			<Field>
				<FieldLabel for="lastName">Last name</FieldLabel>
				<Input
					id="lastName"
					autocomplete="family-name"
					bind:value={lastName}
					aria-invalid={attempted && !!errors.lastName}
				/>
				<FieldError errors={fieldError('lastName')} />
			</Field>

			<Field>
				<FieldLabel for="email">Email</FieldLabel>
				<Input
					id="email"
					type="email"
					inputmode="email"
					autocomplete="email"
					placeholder="you@example.com"
					bind:value={email}
					aria-invalid={attempted && !!errors.email}
				/>
				<FieldError errors={fieldError('email')} />
			</Field>

			<Field>
				<FieldLabel for="phone">Phone</FieldLabel>
				<Input
					id="phone"
					type="tel"
					inputmode="tel"
					autocomplete="tel"
					placeholder="+381 6X XXX XXXX"
					bind:value={phone}
					aria-invalid={attempted && !!errors.phone}
				/>
				<FieldError errors={fieldError('phone')} />
			</Field>
		</div>

		<Field>
			<FieldLabel for="specialRequests">Message to host <span class="font-normal text-muted-foreground">(optional)</span></FieldLabel>
			<Textarea
				id="specialRequests"
				rows={4}
				placeholder="Arrival time, special requests, anything the host should know…"
				bind:value={specialRequests}
			/>
		</Field>
	</section>

	<!-- Payment -->
	<section class="space-y-4">
		<h2 class="text-lg font-semibold tracking-tight">Payment</h2>
		<div class="flex items-center gap-3 rounded-xl border border-primary bg-primary/5 p-4">
			<BanknoteIcon class="size-5 shrink-0 text-primary" aria-hidden="true" />
			<div class="min-w-0 flex-1">
				<p class="text-sm font-medium">Pay with cash at check-in</p>
				<p class="text-xs text-muted-foreground">No card needed — settle the full amount with your host on arrival.</p>
			</div>
			<CircleCheckIcon class="size-5 shrink-0 text-primary" aria-hidden="true" />
		</div>
	</section>

	<!-- Confirm -->
	<div class="space-y-3">
		<p class="text-xs leading-relaxed text-muted-foreground">
			By selecting <span class="font-medium text-foreground">{confirmLabel}</span>, you agree to the
			host’s house rules and to pay the full amount in cash at check-in.
		</p>
		<Button type="submit" size="lg" class="h-11 w-full text-base sm:w-auto sm:px-8" {disabled}>
			{confirmLabel}
		</Button>
	</div>
</form>
