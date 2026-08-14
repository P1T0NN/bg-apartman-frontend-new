import { m } from '@/paraglide/messages';

// TYPES
import type { OptimizeImagesProgressCallback } from './optimizeImages';

export type UseProgressOptions = {
	/** Bar 0–`compressMax` during compression. Default `45`. */
	compressMax?: number;
	/** Bar ceiling during upload steps, before `markDone()` sets 100. Default `95`. */
	workMax?: number;
};

/**
 * Reusable progress state for multi-step flows (e.g. compress → upload each file).
 * Use from `.svelte` / `.svelte.ts` with runes.
 */
export function useProgress(options?: UseProgressOptions) {
	const compressMax = options?.compressMax ?? 45;
	const workMax = options?.workMax ?? 95;
	const uploadSpan = workMax - compressMax;

	let percent = $state(0);
	let label = $state('');

	function uploadSlicePercent(filesDone: number, totalFiles: number): number {
		if (totalFiles <= 0) return compressMax;
		return compressMax + (filesDone / totalFiles) * uploadSpan;
	}

	function start(message?: string) {
		percent = 0;
		label = message ?? m['useProgress.starting']();
	}

	function clear() {
		percent = 0;
		label = '';
	}

	const setOptimizeProgress: OptimizeImagesProgressCallback = (info) => {
		const pct = (info.overallOptimizePercent / 100) * compressMax;
		percent = Math.min(workMax, Math.round(pct));
		label = m['useProgress.compressProgress']({
			current: info.fileIndex + 1,
			total: info.totalFiles,
			percent: Math.round(info.fileCompressionPercent)
		});
	};

	function beforeUploadFile(fileNum: number, totalFiles: number) {
		percent = Math.round(uploadSlicePercent(fileNum - 1, totalFiles));
		label = m['useProgress.uploadingFile']({ current: fileNum, total: totalFiles });
	}

	function afterUploadFile(fileNum: number, totalFiles: number) {
		const pctOfFiles = Math.round((fileNum / totalFiles) * 100);
		percent = Math.min(workMax, Math.round(uploadSlicePercent(fileNum, totalFiles)));
		label = m['useProgress.filesUploaded']({
			current: fileNum,
			total: totalFiles,
			percent: pctOfFiles
		});
	}

	function markDone(doneLabel?: string) {
		percent = 100;
		label = doneLabel ?? m['useProgress.done']();
	}

	return {
		get percent() {
			return percent;
		},
		get label() {
			return label;
		},
		start,
		clear,
		setOptimizeProgress,
		beforeUploadFile,
		afterUploadFile,
		markDone,
		uploadSlicePercent
	};
}
