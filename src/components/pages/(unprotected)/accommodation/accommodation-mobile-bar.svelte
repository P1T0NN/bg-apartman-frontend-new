<script lang="ts">
	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/config/routeEndpoints';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// UTILS
	import { effectiveNightlyPrice } from '@/shared/features/pricing/utils/calculatePrice';
	import { formatCurrency } from '@/utils/formatters';

	// TYPES
	import type { typesAccommodationEnriched } from '@/shared/features/accommodation/types/accommodationTypes';

	let { accommodation }: { accommodation: typesAccommodationEnriched } = $props();

	const nightly = $derived(effectiveNightlyPrice(accommodation));
	const bookHref = $derived(
		UNPROTECTED_PAGE_ENDPOINTS.BOOK_ACCOMMODATION.replace(':slug', accommodation.slug)
	);
</script>

<div
	class="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 border-t bg-background/95 px-4 py-3 backdrop-blur lg:hidden"
>
	<p class="text-sm">
		<span class="text-muted-foreground">from</span>
		<span class="font-semibold">{formatCurrency(nightly)}</span>
		<span class="text-muted-foreground">night</span>
	</p>

	<Button href={bookHref} size="lg" class="h-11 shrink-0 px-6">Check availability</Button>
</div>
