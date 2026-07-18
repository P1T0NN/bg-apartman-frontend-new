<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';

	// COMPONENTS
	import UploadFileItemMultiple from './upload-file-item-multiple.svelte';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { UploadFileRow } from '@/features/uploadFile/types/uploadFileTypes';

	type Props = {
		rows: UploadFileRow[];
		files?: File[];
		onDragOver?: (e: DragEvent) => void;
		onDrop?: (e: DragEvent) => void;
		hasCoverImage?: boolean;
		class?: string;
	};

	let {
		rows,
		files = $bindable<File[]>([]),
		onDragOver,
		onDrop,
		hasCoverImage = false,
		class: className
	}: Props = $props();

	function formatBytes(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'] as const;
		const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
		return `${parseFloat((bytes / Math.pow(k, i)).toFixed(i > 0 ? 1 : 0))} ${sizes[i]}`;
	}
</script>

<!-- Input lives on `UploadFileEmpty`; this region only lists previews + accepts drops. -->
<div
	class={cn('grid grid-cols-2 gap-3 sm:grid-cols-3', className)}
	role="region"
	aria-label={m['UploadFile.UploadFileMultiple.placeholder']()}
	aria-live="polite"
	ondragover={onDragOver}
	ondrop={onDrop}
>
	{#each rows as row (`${row.file.name}-${row.file.size}-${row.file.lastModified}-${row.index}`)}
		<UploadFileItemMultiple
			previewUrl={row.previewUrl}
			name={row.file.name}
			title={row.file.name}
			subtitle={`${row.file.type || m['UploadFile.UploadFileMultiple.unknown']()} · ${formatBytes(row.file.size)}`}
			{hasCoverImage}
			isCover={hasCoverImage && row.index === 0}
			onSetCover={() => (files = [row.file, ...files.filter((_, j) => j !== row.index)])}
			onRemove={() => (files = files.filter((_, j) => j !== row.index))}
		/>
	{/each}
</div>
