<script lang="ts">
	// COMPONENTS
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import AdminAddAccommodationHeader from '@/components/pages/(protected)/admin/add-accommodation/admin-add-accommodation-header.svelte';
	import AdminAddAccommodationForm from '@/components/pages/(protected)/admin/add-accommodation/admin-add-accommodation-form/admin-add-accommodation-form.svelte';
</script>

<SvelteHead
	title="Add accommodation"
	description="Create a listing on behalf of its owner. It goes live after a quick review."
/>

<section class="flex w-full flex-col gap-6 p-4 md:p-6">
	<AdminAddAccommodationHeader />

	<AdminAddAccommodationForm />
</section>
