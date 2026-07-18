<script lang="ts">
	// LIBRARIES
	import { setLocale, getLocale } from '@/shared/lib/paraglide/runtime';

	// COMPONENTS
	import { Button } from '@/shared/components/ui/button/index.js';
	import { NativePopover } from '@/shared/components/ui/native-popover/index.js';

	// SVGS
	import UnitedKingdomFlag from '@/svgs/united-kingdom-flag.svelte';
	import GermanyFlag from '@/svgs/germany-flag.svelte';

	// UTILS
	import { cn } from '@/utils/utils';

	// LUCIDE ICONS
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';

	interface Props {
		variant?: 'default' | 'header';
	}

	let { variant = 'default' }: Props = $props();

	let selectedLanguage = $state(getLocale() === 'sr' ? 'sr' : 'en');

	const languages = [
		{ name: 'English', locale: 'en' as const },
		{ name: 'Srpski', locale: 'sr' as const }
	];

	function handleLanguageChange(languageCode: string) {
		selectedLanguage = languageCode;
		setLocale(languageCode === 'sr' ? 'sr' : 'en');
	}
</script>

<NativePopover align="start" contentClass="w-48">
	{#snippet trigger({ props, anchorStyle })}
		<Button
			{...props}
			style={anchorStyle}
			variant="outline"
			class={cn(
				'flex w-auto items-center gap-2',
				variant === 'header' &&
					'border-hero-overlay-foreground/20 bg-hero-overlay-foreground/10 hover:bg-hero-overlay-foreground/20'
			)}
		>
			{#if selectedLanguage === 'en'}
				<UnitedKingdomFlag />
			{:else}
				<GermanyFlag />
			{/if}

			<span
				class={cn(
					'font-dm-sans text-sm font-medium',
					variant === 'header' ? 'text-hero-overlay-foreground' : 'text-foreground'
				)}
			>
				{selectedLanguage === 'en' ? 'EN' : 'DE'}
			</span>

			<ChevronDownIcon class="size-4 opacity-50" />
		</Button>
	{/snippet}

	{#snippet content({ close })}
		{#each languages as language (language.locale)}
			<button
				type="button"
				class={cn(
					'flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent hover:text-accent-foreground',
					selectedLanguage === language.locale && 'bg-accent/50'
				)}
				onclick={() => {
					handleLanguageChange(language.locale);
					close();
				}}
			>
				{#if language.locale === 'en'}
					<UnitedKingdomFlag />
				{:else}
					<GermanyFlag />
				{/if}

				<div class="flex flex-col">
					<span class="font-dm-sans text-sm font-medium">
						{language.name}
					</span>

					<span class="font-dm-sans text-xs text-muted-foreground">
						{language.locale === 'en' ? 'EN' : 'DE'}
					</span>
				</div>
			</button>
		{/each}
	{/snippet}
</NativePopover>
