<script lang="ts">
	// I18N
	import { m } from '@/paraglide/messages';

	// COMPONENTS
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import AddAccommodationHeader from '@/components/pages/(protected)/host/add-accommodation/add-accommodation-header.svelte';
	import AddAccommodationForm from '@/components/pages/(protected)/host/add-accommodation/add-accommodation-form/add-accommodation-form.svelte';
</script>

<SvelteHead
	title={m['HostAddAccommodationPage.SEO.title']()}
	description={m['HostAddAccommodationPage.SEO.description']()}
/>

<section class="flex w-full flex-col gap-6 p-4 md:p-6">
	<AddAccommodationHeader />

	<AddAccommodationForm />
</section>
