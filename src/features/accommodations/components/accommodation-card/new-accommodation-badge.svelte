<script lang="ts">
	import { m } from '@/paraglide/messages';

	// COMPONENTS
	import { Badge } from '@/components/ui/badge';

	// UTILS
	import { cn } from '@/utils/utils.js';

	let { class: className }: { class?: string } = $props();
</script>

<!-- Shares the top-left slot with SuperhostBadge, but a new accommodation is never a superhost. -->
<Badge variant="secondary" class={cn('absolute top-3 left-3 shadow-sm', className)}>{m['AccommodationsFeature.AccommodationCard.NewAccommodationBadge.new']()}</Badge>
