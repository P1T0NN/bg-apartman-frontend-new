<script lang="ts">
	// COMPONENTS
	import ReservationsHeader from '@/components/pages/(unprotected)/reservations/reservations-header.svelte';
	import ReservationsForm from '@/components/pages/(unprotected)/reservations/reservations-form.svelte';
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import Section from '@/components/ui/section/section.svelte';
</script>

<SvelteHead
	title="Find your reservation"
	description="Lost the email? Look your booking up with your booking code and email address."
	noIndex
/>

<!-- No loader: the page is a form, it resolves on submit (GuestSystemDesign.md §7). -->
<Section class="min-h-dvh" yPadding="lg" containerClass="max-w-md">
	<ReservationsHeader />

	<ReservationsForm />

	<p class="mt-6 text-sm text-muted-foreground">
		Still stuck? <a href="/contact" class="text-foreground underline underline-offset-4">
			Contact us
		</a> and we'll look it up for you.
	</p>
</Section>
