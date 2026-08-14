<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import { cn } from '@/utils/utils.js';
	import { PaginationLink } from './index.js';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';

	// I18N
	import { m } from '@/paraglide/messages';

	type PaginationNextProps = ComponentProps<typeof PaginationLink>;

	let { class: className, ...restProps }: PaginationNextProps = $props();
</script>

<PaginationLink
	aria-label={m['Pagination.PaginationNext.goToNextPage']()}
	size="default"
	class={cn('pr-1.5!', className)}
	{...restProps}
>
	<span class="cn-pagination-next-text hidden sm:block">{m['Pagination.PaginationNext.next']()}</span>
	<ChevronRightIcon data-icon="inline-end" />
</PaginationLink>
