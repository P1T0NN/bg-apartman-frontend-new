<script lang="ts">
	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/config/routeEndpoints';

	// COMPONENTS
	import Button from '@/components/ui/button/button.svelte';
</script>

<Button variant="outline" href={UNPROTECTED_PAGE_ENDPOINTS.LOGIN}>Login</Button>
