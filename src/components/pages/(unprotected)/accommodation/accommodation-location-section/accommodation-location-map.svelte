<script lang="ts">
	// I18N
	import { m } from '@/paraglide/messages';

	let {
		title,
		mapSrc
	}: {
		title: string;
		mapSrc: string;
	} = $props();
</script>

<div class="overflow-hidden rounded-2xl border bg-muted">
	<iframe
		title={m['AccommodationPage.AccommodationLocationMap.mapTitle']({ title })}
		src={mapSrc}
		class="aspect-video w-full"
		loading="lazy"
		referrerpolicy="no-referrer-when-downgrade"
	></iframe>
</div>
