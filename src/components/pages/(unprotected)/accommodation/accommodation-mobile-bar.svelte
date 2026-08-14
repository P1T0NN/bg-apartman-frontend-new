<script lang="ts">
	// I18N
	import { m } from '@/paraglide/messages';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/config/routeEndpoints';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// UTILS
	import { appHref } from '@/utils/app-navigation.js';
	import { hasNightlyDiscount } from '@/features/accommodations/utils/accommodationPresentation';
	import { effectiveNightlyPrice } from '@/shared/features/pricing/utils/calculatePrice';
	import { formatCurrency } from '@/utils/formatters';

	// TYPES
	import type { typesAccommodationEnriched } from '@/shared/features/accommodation/types/accommodationTypes';

	let { accommodation }: { accommodation: typesAccommodationEnriched } = $props();

	const nightly = $derived(effectiveNightlyPrice(accommodation));
	const discounted = $derived(hasNightlyDiscount(accommodation));
	const bookHref = $derived(
		appHref(UNPROTECTED_PAGE_ENDPOINTS.BOOK_ACCOMMODATION.replace(':slug', accommodation.slug))
	);
</script>

<div
	class="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 border-t bg-background/95 px-4 py-3 backdrop-blur lg:hidden"
>
	<p class="text-sm">
		<span class="text-muted-foreground">{m['AccommodationPage.AccommodationMobileBar.from']()}</span
		>
		<span class="font-semibold {discounted ? 'text-emerald-700 dark:text-emerald-300' : ''}"
			>{formatCurrency(nightly)}</span
		>
		<span class="text-muted-foreground"
			>{m['AccommodationPage.AccommodationMobileBar.night']()}</span
		>
	</p>

	<Button href={bookHref} size="lg" class="h-11 shrink-0 px-6"
		>{m['AccommodationPage.AccommodationMobileBar.checkAvailability']()}</Button
	>
</div>
