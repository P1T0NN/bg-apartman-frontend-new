<script lang="ts">
	// I18N
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import AdminAddAccommodationHeader from '@/components/pages/(protected)/admin/add-accommodation/admin-add-accommodation-header.svelte';
	import AdminAddAccommodationForm from '@/components/pages/(protected)/admin/add-accommodation/admin-add-accommodation-form/admin-add-accommodation-form.svelte';
</script>

<SvelteHead
	title={m['AdminAddAccommodationPage.SEO.title']()}
	description={m['AdminAddAccommodationPage.SEO.description']()}
/>

<section class="flex w-full flex-col gap-6 p-4 md:p-6">
	<AdminAddAccommodationHeader />

	<AdminAddAccommodationForm />
</section>
