<script lang="ts">
	// COMPONENTS
	import { Input } from '@/shared/components/ui/input/index.js';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { MutationFormFieldDef } from './types.js';

	let {
		field,
		inputId,
		value,
		setValue,
		invalid
	}: {
		field: MutationFormFieldDef;
		inputId: string;
		value: unknown;
		setValue: (next: unknown) => void;
		invalid: boolean;
	} = $props();

	// Quick-pick buttons; anything outside this range (0, 6+, …) is entered via "Custom".
	const OPTIONS = ['1', '2', '3', '4', '5'];

	const current = $derived(value == null ? '' : String(value));

	// Open straight into the manual input when the stored value isn't one of the presets
	// (e.g. editing a listing with 8 guests, or a studio with 0 bedrooms).
	// svelte-ignore state_referenced_locally
	let custom = $state(current !== '' && !OPTIONS.includes(current));
</script>

<div class="space-y-2">
	<div
		class={cn('flex gap-0.5 rounded-lg border bg-muted/40 p-0.5', invalid && 'border-destructive')}
	>
		{#each OPTIONS as opt (opt)}
			{@const active = !custom && current === opt}
			<button
				type="button"
				aria-pressed={active}
				onclick={() => {
					custom = false;
					setValue(opt);
				}}
				class={cn(
					'flex-1 rounded-md px-2 py-1.5 text-sm font-medium transition',
					active
						? 'bg-background text-foreground shadow-sm'
						: 'text-muted-foreground hover:text-foreground'
				)}
			>
				{opt}
			</button>
		{/each}
		<button
			type="button"
			aria-pressed={custom}
			onclick={() => (custom = true)}
			class={cn(
				'flex-1 rounded-md px-2 py-1.5 text-sm font-medium transition',
				custom
					? 'bg-background text-foreground shadow-sm'
					: 'text-muted-foreground hover:text-foreground'
			)}
		>
			Custom
		</button>
	</div>

	{#if custom}
		<Input
			id={inputId}
			name={field.id}
			type="number"
			min="0"
			inputmode="numeric"
			placeholder={field.placeholder ?? 'Enter a number'}
			value={value as string | number | undefined}
			oninput={(e) => setValue(e.currentTarget.value)}
			aria-invalid={invalid ? 'true' : undefined}
		/>
	{/if}
</div>
