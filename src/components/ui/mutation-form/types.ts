import type { Component, Snippet } from 'svelte';
import type { FullAutoFill, HTMLInputTypeAttribute } from 'svelte/elements';

export type MutationFormFieldKind =
	| 'input'
	| 'textarea'
	| 'select'
	| 'checkbox'
	| 'radio'
	| 'toggle'
	| 'counter'
	| 'time'
	| 'upload-single'
	| 'upload-multiple';

export type MutationFormSelectOption = {
	value: string;
	label: string;
	disabled?: boolean;
};

export type MutationFormFieldDef = {
	/** Key used in the values record, name attribute, and id suffix. */
	id: string;
	label: string;
	kind: MutationFormFieldKind;

	/** Common */
	placeholder?: string;
	description?: string;
	autocomplete?: FullAutoFill;
	autofocus?: boolean;
	disabled?: boolean;
	required?: boolean;
	fieldClass?: string;

	/** kind: 'input' */
	type?: HTMLInputTypeAttribute;

	/** kind: 'textarea' */
	rows?: number;

	/** kind: 'select' | 'radio' */
	options?: MutationFormSelectOption[];
	/** Trigger label when the bound value is empty. */
	selectPlaceholder?: string;

	/** kind: 'radio' */
	radioOrientation?: 'vertical' | 'horizontal';

	/** kind: 'toggle' — icon shown in the tile. */
	icon?: Component<{ class?: string }>;

	/** kind: 'upload-single' | 'upload-multiple' */
	accept?: string;

	/**
	 * kind: 'upload-multiple'. Shows a star control on each preview; the starred
	 * image is moved to index 0 of the files array, so after upload the first
	 * storage id in the submitted array is the cover image.
	 */
	hasCoverImage?: boolean;

	/** Grid columns the field occupies inside a section. Defaults to 2 (full width). */
	colSpan?: 1 | 2;
};

/** Header shown above a wizard step (title, description, optional icon). */
export type MutationFormStepMeta = {
	title?: string;
	description?: string;
	icon?: Component<{ class?: string }>;
};

export type MutationFormSection = {
	id?: string;
	title?: string;
	description?: string;
	/** Wizard mode: icon for the step header. */
	icon?: Component<{ class?: string }>;
	fields: MutationFormFieldDef[];
	/** Section grid column count. Defaults to 2. */
	columns?: 1 | 2;
	/** Render the section without a Card wrapper. */
	plain?: boolean;
	class?: string;
};

export type MutationFormFieldSnippetProps<T extends Record<string, unknown>> = {
	field: MutationFormFieldDef;
	value: T[keyof T];
	setValue: (next: unknown) => void;
	error: string | undefined;
	inputId: string;
};

export type MutationFormCustomFields<T extends Record<string, unknown>> = Partial<
	Record<string, Snippet<[MutationFormFieldSnippetProps<T>]>>
>;

export type MutationFormFieldErrors<T extends Record<string, unknown>> = Partial<
	Record<keyof T & string, string | undefined>
>;

export type MutationFormProgress = {
	readonly percent: number;
	readonly label: string;
	start: (message?: string) => void;
	clear: () => void;
	setOptimizeProgress: (info: {
		overallOptimizePercent: number;
		fileIndex: number;
		totalFiles: number;
		fileCompressionPercent: number;
	}) => void;
	beforeUploadFile: (fileNum: number, totalFiles: number) => void;
	afterUploadFile: (fileNum: number, totalFiles: number) => void;
	markDone: (doneLabel?: string) => void;
};

export type MutationFormPrepareSubmit<T extends Record<string, unknown>> = (context: {
	values: T;
	args: Record<string, unknown>;
	sections: MutationFormSection[];
	progress: MutationFormProgress;
}) => boolean | void | Promise<boolean | void>;

export type MutationFormSubmitHandler<T extends Record<string, unknown>> = (
	args: Record<string, unknown>,
	values: T
) => boolean | void | Promise<boolean | void>;
