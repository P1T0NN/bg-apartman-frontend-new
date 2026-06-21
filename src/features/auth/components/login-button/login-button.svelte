<script lang="ts">
    // LIBRARIES
    import { localizeHref } from '@/shared/lib/paraglide/runtime';
    import { m } from '@/shared/lib/paraglide/messages';

    // CONFIG
    import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/constants';
    
    // COMPONENTS
    import Button from '@/shared/components/ui/button/button.svelte';
</script>

<Button
    variant="outline"
    href={localizeHref(UNPROTECTED_PAGE_ENDPOINTS.LOGIN)}
>
    {m['LoginButton.login']()}
</Button>