<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import { cn } from '@/utils/utils.js';
	import { PaginationLink } from './index.js';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';

	// I18N
	import { m } from '@/paraglide/messages';

	type PaginationPreviousProps = ComponentProps<typeof PaginationLink>;

	let { class: className, ...restProps }: PaginationPreviousProps = $props();
</script>

<PaginationLink
	aria-label={m['Pagination.PaginationPrevious.goToPreviousPage']()}
	size="default"
	class={cn('pl-1.5!', className)}
	{...restProps}
>
	<ChevronLeftIcon data-icon="inline-start" />
	<span class="cn-pagination-previous-text hidden sm:block">{m['Pagination.PaginationPrevious.previous']()}</span>
</PaginationLink>
