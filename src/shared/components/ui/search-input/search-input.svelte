<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';

	// COMPONENTS
	import SearchDropdown from './search-dropdown.svelte';
	import { Input } from '@/shared/components/ui/input/index.js';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { SearchInputItem, SearchInputProps } from './types.js';

	// LUCIDE ICONS
	import SearchIcon from '@lucide/svelte/icons/search';

	let {
		ref = $bindable(null),
		value = $bindable(''),
		items = [],
		loading = false,
		error = null,
		showEmpty = true,
		minQueryLength = 1,
		placeholder = m['SearchInput.placeholder'](),
		class: className,
		dropdownClass,
		loadingText,
		emptyTitle,
		emptyDescription,
		selectValueOnSelect = true,
		onSelect,
		onClick,
		id,
		disabled,
		'aria-label': ariaLabel = m['SearchInput.ariaLabel'](),
		...restProps
	}: SearchInputProps = $props();

	const fallbackId = $props.id();
	const inputId = $derived(id ?? `${fallbackId}-input`);
	const listboxId = $derived(`${inputId}-listbox`);

	let isOpen = $state(false);
	let activeIndex = $state(0);
	let rootRef: HTMLDivElement | null = $state(null);

	let hasQuery = $derived(value.trim().length >= minQueryLength);
	let hasResults = $derived(items.length > 0);
	let hasDropdownContent = $derived(hasResults || loading || Boolean(error) || showEmpty);
	let shouldShowDropdown = $derived(isOpen && !disabled && hasQuery && hasDropdownContent);
	let dropdown = $derived.by(() => {
		const visibleActiveIndex = hasResults ? Math.min(activeIndex, items.length - 1) : 0;
		const activeItem = items[visibleActiveIndex];
		const activeDescendant =
			shouldShowDropdown && hasResults && activeItem
				? `${inputId}-option-${activeItem.id}`
				: undefined;
		return { visibleActiveIndex, activeItem, activeDescendant };
	});

	function openDropdown() {
		if (disabled) return;

		isOpen = true;
	}

	function closeDropdown() {
		isOpen = false;
		activeIndex = 0;
	}

	function handleSearchInput() {
		if (!value.trim() || value.trim().length < minQueryLength) {
			closeDropdown();
			return;
		}

		openDropdown();
	}

	function selectItem(item: SearchInputItem) {
		if (selectValueOnSelect) {
			value = item.title;
		}

		onSelect?.(item);
		onClick?.(item);
		closeDropdown();
		ref?.focus();
	}

	function handleActiveIndexChange(index: number) {
		activeIndex = index;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (disabled) return;

		if (event.key === 'ArrowDown') {
			event.preventDefault();
			isOpen = true;
			activeIndex = hasResults ? (activeIndex + 1) % items.length : 0;
			return;
		}

		if (event.key === 'ArrowUp') {
			event.preventDefault();
			isOpen = true;
			activeIndex = hasResults ? (activeIndex - 1 + items.length) % items.length : 0;
			return;
		}

		if (event.key === 'Enter' && isOpen && hasResults && dropdown.activeItem) {
			event.preventDefault();
			selectItem(dropdown.activeItem);
			return;
		}

		if (event.key === 'Escape') {
			closeDropdown();
		}
	}

	function handleFocusOut(event: FocusEvent) {
		const nextTarget = event.relatedTarget;

		if (!(nextTarget instanceof Node) || !rootRef?.contains(nextTarget)) {
			closeDropdown();
		}
	}
</script>

<div
	bind:this={rootRef}
	data-slot="search-input"
	class={cn('relative w-full max-w-md', className)}
	onfocusout={handleFocusOut}
>
	<div class="relative">
		<SearchIcon
			class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
			aria-hidden="true"
		/>

		<Input
			bind:ref
			bind:value
			{disabled}
			id={inputId}
			type="search"
			role="combobox"
			aria-label={ariaLabel}
			aria-controls={listboxId}
			aria-expanded={shouldShowDropdown}
			aria-autocomplete="list"
			aria-activedescendant={dropdown.activeDescendant}
			data-slot="search-input-field"
			class="pl-9"
			{placeholder}
			onfocus={openDropdown}
			oninput={handleSearchInput}
			onkeydown={handleKeydown}
			{...restProps}
		/>
	</div>

	{#if shouldShowDropdown}
		<SearchDropdown
			{listboxId}
			{inputId}
			{items}
			activeIndex={dropdown.visibleActiveIndex}
			{dropdownClass}
			{loading}
			{error}
			{loadingText}
			{emptyTitle}
			{emptyDescription}
			onActiveIndexChange={handleActiveIndexChange}
			onSelect={selectItem}
		/>
	{/if}
</div>
