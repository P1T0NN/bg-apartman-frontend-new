<script lang="ts">
	import { m } from '@/lib/paraglide/messages';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// LUCIDE ICONS
	import UploadIcon from '@lucide/svelte/icons/upload';

	type Props = {
		class?: string;
		pickerInputId: string;
		accept?: string;
		disabled?: boolean;
		multipleFiles?: boolean;
		dragOver?: boolean;
		/** Render the dropzone with a destructive border (failed validation). */
		invalid?: boolean;
		fileInputRef?: HTMLInputElement | null;
		onFileInputChange?: (e: Event) => void;
		onDragEnter?: (e: DragEvent) => void;
		onDragLeave?: (e: DragEvent) => void;
		onDragOver?: (e: DragEvent) => void;
		onDrop?: (e: DragEvent) => void;
	};

	let {
		class: className,
		pickerInputId,
		accept,
		disabled = false,
		multipleFiles = false,
		dragOver = false,
		invalid = false,
		fileInputRef = $bindable<HTMLInputElement | null>(null),
		onFileInputChange,
		onDragEnter,
		onDragLeave,
		onDragOver,
		onDrop
	}: Props = $props();
</script>

<label
	class={cn(
		'block cursor-pointer rounded-xl border border-dashed border-input bg-muted/15 p-6 transition-colors outline-none focus-within:ring-[3px] focus-within:ring-ring/50 hover:bg-muted/25',
		invalid && 'border-destructive bg-destructive/5 hover:bg-destructive/10',
		dragOver && 'border-primary/60 bg-primary/5 ring-[3px] ring-primary/20',
		className
	)}
	ondragenter={onDragEnter}
	ondragleave={onDragLeave}
	ondragover={onDragOver}
	ondrop={onDrop}
>
	<input
		id={pickerInputId}
		bind:this={fileInputRef}
		type="file"
		class="sr-only"
		{accept}
		{disabled}
		multiple={multipleFiles}
		onchange={onFileInputChange}
	/>
	<div class="pointer-events-none flex flex-col items-center gap-2 text-center">
		<span
			class="inline-flex size-11 items-center justify-center rounded-full bg-background text-muted-foreground shadow-sm ring-1 ring-border"
		>
			<UploadIcon class="size-5" aria-hidden="true" />
		</span>
		<div class="space-y-0.5">
			<p class="text-sm font-medium text-foreground">
				<span class="text-primary"
					>{multipleFiles ? m['UploadFileFeature.UploadFile.UploadFileEmpty.choosePlural']() : m['UploadFileFeature.UploadFile.UploadFileEmpty.chooseSingular']()}</span
				>
				<span class="font-normal text-muted-foreground">
					{multipleFiles ? m['UploadFileFeature.UploadFile.UploadFileEmpty.dragPlural']() : m['UploadFileFeature.UploadFile.UploadFileEmpty.dragSingular']()}
				</span>
			</p>
			{#if accept}
				<p class="text-xs text-muted-foreground">
					{m['UploadFileFeature.UploadFile.UploadFileEmpty.accepted']({ format: accept })}
				</p>
			{/if}
		</div>
	</div>
</label>
