<script lang="ts">
	// LIBRARIES
	import { getLocale, setLocale } from '@/paraglide/runtime';

	// COMPONENTS
	import { Button, type ButtonVariant } from '@/components/ui/button/index.js';

	// UTILS
	import { cn } from '@/utils/utils.js';

	let {
		class: className,
		variant = 'outline'
	}: { class?: string; variant?: ButtonVariant } = $props();

	// Labels are the languages' own names — not translated.
	const LABELS = { en: 'English', sr: 'Srpski' } as const;

	// The selector lives in the header, which always sits on the dark hero overlay —
	// outline (and ghost) must render hero-flavored there: transparent bg, white text,
	// white border. The variant's own `bg-background`/`text-foreground` are overridden
	// below, so they can never produce white-on-white.
	const onHero = $derived(variant === 'outline' || variant === 'ghost');

	function toggleLocale() {
		// Public pages: setLocale's URL strategy navigates to the localized URL
		// (e.g. `/sr/search`); cookie-only routes (host/guest/admin) just switch
		// via the PARAGLIDE_LOCALE cookie and reload.
		setLocale(getLocale() === 'en' ? 'sr' : 'en');
	}
</script>

<Button
	type="button"
	{variant}
	onclick={toggleLocale}
	class={cn(
		'h-8 shrink-0 rounded-full px-3 text-sm font-medium',
		onHero &&
			'border-hero-overlay-foreground/40 bg-transparent text-hero-overlay-foreground hover:bg-hero-overlay-foreground/10 hover:text-hero-overlay-foreground focus-visible:ring-[3px] focus-visible:ring-hero-overlay-foreground/40',
		className
	)}
	aria-label={getLocale() === 'en' ? 'Switch to Serbian (Srpski)' : 'Switch to English'}
>
	{LABELS[getLocale()]}
</Button>
