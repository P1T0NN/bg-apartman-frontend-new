<script lang="ts">
	// I18N
	import { m } from '@/paraglide/messages';

	// UTILS
	import { appHref } from '@/utils/app-navigation.js';

	// COMPONENTS
	import ReservationsHeader from '@/components/pages/(unprotected)/reservations/reservations-header.svelte';
	import ReservationsForm from '@/components/pages/(unprotected)/reservations/reservations-form.svelte';
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import Section from '@/components/ui/section/section.svelte';
</script>

<SvelteHead
	title={m['ReservationsPage.SEO.title']()}
	description={m['ReservationsPage.SEO.description']()}
	noIndex
/>

<!-- No loader: the page is a form, it resolves on submit (GuestSystemDesign.md §7). -->
<Section class="min-h-dvh" yPadding="lg" containerClass="max-w-md">
	<ReservationsHeader />

	<ReservationsForm />

	<p class="mt-6 text-sm text-muted-foreground">
		{m['ReservationsPage.stillStuck']()}
		<a href={appHref('/contact')} class="text-foreground underline underline-offset-4">
			{m['ReservationsPage.contactUs']()}
		</a>
		{m['ReservationsPage.wellLookItUp']()}
	</p>
</Section>
