<script lang="ts">
	// COMPONENTS
	import { Input } from '@/shared/components/ui/input/index.js';

	let {
		id,
		value = '',
		setValue,
		placeholder = 'HH:MM',
		disabled = false,
		invalid = false
	}: {
		id?: string;
		value?: string;
		setValue?: (next: string) => void;
		placeholder?: string;
		disabled?: boolean;
		invalid?: boolean;
	} = $props();

	// Mask free typing into HH:MM: keep digits only, clamp hours ≤ 23 / minutes ≤ 59, and drop the
	// ":" in automatically once two digits are entered (so the user just types the next two).
	// `deleting` keeps the auto-colon from sticking when they backspace past it.
	function mask(raw: string, deleting: boolean): string {
		const digits = raw.replace(/\D/g, '').slice(0, 4);
		let hh = digits.slice(0, 2);
		let mm = digits.slice(2, 4);
		if (hh.length === 2 && Number(hh) > 23) hh = '23';
		if (mm.length === 2 && Number(mm) > 59) mm = '59';
		if (digits.length > 2) return `${hh}:${mm}`;
		if (digits.length === 2) return deleting ? hh : `${hh}:`;
		return hh;
	}
</script>

<Input
	{id}
	{disabled}
	{placeholder}
	inputmode="numeric"
	value={value as string}
	aria-invalid={invalid ? 'true' : undefined}
	oninput={(e) => {
		const deleting = (e as unknown as InputEvent).inputType?.startsWith('delete') ?? false;
		const next = mask(e.currentTarget.value, deleting);
		e.currentTarget.value = next;
		setValue?.(next);
	}}
/>
