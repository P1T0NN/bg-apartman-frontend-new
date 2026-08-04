<script lang="ts">
	// COMPONENTS
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import AddAccommodationHeader from '@/components/pages/(protected)/host/add-accommodation/add-accommodation-header.svelte';
	import AddAccommodationForm from '@/components/pages/(protected)/host/add-accommodation/add-accommodation-form/add-accommodation-form.svelte';
</script>

<SvelteHead
	title="List your accommodation"
	description="Fill in the details below. Everything can be edited later — your accommodation goes live after a quick review."
/>

<section class="flex w-full flex-col gap-6 p-4 md:p-6">
	<AddAccommodationHeader />

	<AddAccommodationForm />
</section>
