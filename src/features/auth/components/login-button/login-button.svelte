<script lang="ts">
	// I18N
	import { m } from '@/paraglide/messages';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/config/routeEndpoints';

	// COMPONENTS
	import Button from '@/components/ui/button/button.svelte';
</script>

<Button variant="outline" href={UNPROTECTED_PAGE_ENDPOINTS.LOGIN}>
	{m['AuthFeature.LoginButton.login']()}
</Button>
