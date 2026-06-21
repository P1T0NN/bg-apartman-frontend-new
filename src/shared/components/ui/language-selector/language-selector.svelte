<script lang="ts">
	// LIBRARIES
	import { setLocale, getLocale } from '@/shared/lib/paraglide/runtime';

	// COMPONENTS
	import { Select, SelectTrigger, SelectContent, SelectItem } from '@/shared/components/ui/select';

	// SVGS
	import UnitedKingdomFlag from '@/shared/svgs/united-kingdom-flag.svelte';
	import GermanyFlag from '@/shared/svgs/germany-flag.svelte';

	// UTILS
	import { cn } from '@/shared/utils/utils';

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

<Select type="single" bind:value={selectedLanguage} onValueChange={handleLanguageChange}>
	<SelectTrigger
		class={cn(
			'flex items-center space-x-2 w-auto',
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
	</SelectTrigger>

	<SelectContent>
		{#each languages as language}
			<SelectItem value={language.locale}>
				<div class="flex items-center space-x-3">
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
				</div>
			</SelectItem>
		{/each}
	</SelectContent>
</Select>
