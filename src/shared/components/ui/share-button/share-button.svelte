<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';

	// COMPONENTS
	import { Button } from '@/shared/components/ui/button/index.js';
	import { toast } from 'svelte-sonner';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { ComponentProps } from 'svelte';

	// LUCIDE ICONS
	import ShareIcon from '@lucide/svelte/icons/share';

	type ButtonProps = ComponentProps<typeof Button>;

	let {
		url,
		title,
		text,
		label = m['ShareButton.label'](),
		copiedMessage = m['ShareButton.copiedMessage'](),
		layout = 'toolbar',
		showLabel = true,
		class: className,
		...buttonProps
	}: {
		/** Page or resource URL. Defaults to the current location at click time. */
		url?: string;
		/** Web Share API title. Falls back to `document.title` when sharing. */
		title?: string;
		/** Optional extra text passed to the native share sheet. */
		text?: string;
		label?: string;
		copiedMessage?: string;
		/** Ghost toolbar button or compact icon-only control. */
		layout?: 'toolbar' | 'icon';
		showLabel?: boolean;
		class?: string;
	} & Omit<ButtonProps, 'onclick' | 'children'> = $props();

	async function share(event?: MouseEvent) {
		event?.preventDefault();
		event?.stopPropagation();

		const shareUrl = url ?? (typeof window !== 'undefined' ? window.location.href : '');
		if (!shareUrl) return;

		try {
			if (navigator.share) {
				await navigator.share({
					title: title ?? (typeof document !== 'undefined' ? document.title : undefined),
					text,
					url: shareUrl
				});
				return;
			}

			await navigator.clipboard.writeText(shareUrl);
			toast.success(copiedMessage);
		} catch {
			/* user dismissed the share sheet — nothing to do */
		}
	}
</script>

{#if layout === 'icon'}
	<button
		type="button"
		aria-label={label}
		onclick={share}
		class={cn(
			'grid size-8 place-items-center rounded-full text-foreground transition hover:bg-muted/60',
			className
		)}
	>
		<ShareIcon class="size-4" aria-hidden="true" />
	</button>
{:else}
	<Button variant="ghost" size="sm" onclick={share} class={className} {...buttonProps}>
		<ShareIcon class="size-4" aria-hidden="true" />

		{#if showLabel}
			<span class="hidden sm:inline">{label}</span>
		{/if}
	</Button>
{/if}
