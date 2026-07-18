<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';

	// COMPONENTS
	import { Button } from '@/shared/components/ui/button/index.js';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// LUCIDE ICONS
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import StarIcon from '@lucide/svelte/icons/star';
	import XIcon from '@lucide/svelte/icons/x';

	// Presentational photo tile — knows nothing about File vs stored image. Used by the
	// upload list (new Files) and the edit page's existing-photos grid (stored R2 refs).
	type Props = {
		class?: string;
		previewUrl?: string | null;
		/** Accessible name used in the control labels. */
		name: string;
		/** Footer line 1 (e.g. file name). Footer hidden when omitted. */
		title?: string;
		/** Footer line 2 (e.g. "image/png · 1.2 MB"). */
		subtitle?: string;
		hasCoverImage?: boolean;
		isCover?: boolean;
		onSetCover?: () => void;
		onRemove: () => void;
	};

	let {
		class: className,
		previewUrl = null,
		name,
		title,
		subtitle,
		hasCoverImage = false,
		isCover = false,
		onSetCover,
		onRemove
	}: Props = $props();
</script>

<div
	class={cn(
		'group/item relative overflow-hidden rounded-xl border border-input bg-card shadow-sm',
		className
	)}
>
	<div class="relative aspect-square max-h-56 w-full bg-muted/30">
		{#if previewUrl}
			<img src={previewUrl} alt="" class="size-full object-cover" draggable="false" />
		{:else}
			<div class="flex size-full items-center justify-center text-muted-foreground">
				<FileTextIcon class="size-12" aria-hidden="true" />
			</div>
		{/if}

		{#if hasCoverImage}
			<div class="absolute start-1.5 top-1.5">
				{#if isCover}
					<span
						class="flex items-center gap-1 rounded-md bg-primary px-1.5 py-1 text-[0.65rem] font-medium text-primary-foreground shadow-md"
					>
						<StarIcon class="size-3.5 fill-current" aria-hidden="true" />
						{m['UploadFile.UploadFileMultiple.cover']()}
					</span>
				{:else}
					<Button
						type="button"
						variant="secondary"
						size="icon-sm"
						class="shadow-md"
						onclick={onSetCover}
						aria-label={m['UploadFile.UploadFileMultiple.setCover']({ name })}
					>
						<StarIcon class="size-3.5" aria-hidden="true" />
					</Button>
				{/if}
			</div>
		{/if}

		<div class="absolute end-1.5 top-1.5">
			<Button
				type="button"
				variant="destructive"
				size="icon-sm"
				class="shadow-md"
				onclick={onRemove}
				aria-label={m['UploadFile.UploadFileMultiple.remove']({ name })}
			>
				<XIcon class="size-3.5" aria-hidden="true" />
			</Button>
		</div>
	</div>

	{#if title}
		<div class="space-y-0.5 px-2.5 py-2">
			<p class="truncate text-xs font-medium text-foreground" {title}>
				{title}
			</p>

			{#if subtitle}
				<p class="text-[0.65rem] leading-tight text-muted-foreground">{subtitle}</p>
			{/if}
		</div>
	{/if}
</div>
