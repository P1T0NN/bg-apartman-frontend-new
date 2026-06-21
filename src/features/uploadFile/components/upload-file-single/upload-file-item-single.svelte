<script lang="ts">
	// LIBRARIES
	import { m } from "@/shared/lib/paraglide/messages";

	// COMPONENTS
	import { Button } from '@/shared/components/ui/button/index.js';

	// UTILS
	import { cn } from '@/shared/utils/utils.js';

	// LUCIDE ICONS
	import FileTextIcon from '@lucide/svelte/icons/file-text';

	type Props = {
		class?: string;
		file: File;
		files?: File[];
		selectedFile?: File | null;
		pickerInputId: string;
		previewUrl?: string | null;
	};

	let {
		class: className,
		file,
		files = $bindable<File[]>([]),
		selectedFile = $bindable<File | null>(null),
		pickerInputId,
		previewUrl = null
	}: Props = $props();

	function formatBytes(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'] as const;
		const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
		return `${parseFloat((bytes / Math.pow(k, i)).toFixed(i > 0 ? 1 : 0))} ${sizes[i]}`;
	}

	function replace() {
		document.getElementById(pickerInputId)?.click();
	}

	function remove() {
		selectedFile = null;
	}
</script>

<div
	class={cn(
		'border-input bg-card flex gap-3 rounded-xl border p-3 shadow-sm',
		className
	)}
>
	{#if previewUrl}
		<div class="bg-muted/40 relative size-20 shrink-0 overflow-hidden rounded-lg border">
			<img src={previewUrl} alt="" class="size-full object-cover" draggable="false" />
		</div>
	{:else}
		<div
			class="bg-muted/50 text-muted-foreground flex size-20 shrink-0 items-center justify-center rounded-lg border"
		>
			<FileTextIcon class="size-8" aria-hidden="true" />
		</div>
	{/if}

	<div class="min-w-0 flex-1 py-0.5">
		<p class="text-foreground truncate text-sm font-medium" title={file.name}>
			{file.name}
		</p>
		
		<p class="text-muted-foreground mt-0.5 text-xs">
			{file.type || m['UploadFile.UploadFileSingle.unknownType']()} · {formatBytes(file.size)}
		</p>

		<div class="mt-3 flex flex-wrap items-center gap-2">
			<Button type="button" variant="outline" size="sm" onclick={replace}>
				{m['UploadFile.UploadFileSingle.replace']()}
			</Button>

			<Button type="button" variant="destructive" size="sm" onclick={remove}>
				{m['UploadFile.UploadFileSingle.remove']()}
			</Button>
		</div>
	</div>
</div>
