<script lang="ts">
	// I18N
	import { m } from '@/lib/paraglide/messages';

	// UTILS
	import { formatDateRange, formatGuestsShort } from '@/utils/formatters';

	let {
		checkIn,
		checkOut,
		adults,
		children
	}: {
		checkIn: string | null;
		checkOut: string | null;
		adults: number;
		children: number;
	} = $props();
</script>

<dl class="space-y-2 text-sm">
	<div class="flex items-center justify-between gap-3">
		<dt class="text-muted-foreground">{m['BookPage.BookGuestDetails.dates']()}</dt>
		<dd class="text-right font-medium">
			{checkIn && checkOut ? formatDateRange(checkIn, checkOut) : '—'}
		</dd>
	</div>
	<div class="flex items-center justify-between gap-3">
		<dt class="text-muted-foreground">{m['BookPage.BookGuestDetails.guests']()}</dt>
		<dd class="text-right font-medium">{formatGuestsShort(adults, children)}</dd>
	</div>
</dl>
