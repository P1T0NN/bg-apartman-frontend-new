<script lang="ts" generics="T extends Record<string, unknown>">
	// LIBRARIES
	import { useConvexClient } from 'convex-svelte';
	import { toast } from 'svelte-sonner';
	import { m } from '@/shared/lib/paraglide/messages';
	import type { ZodType } from 'zod';

	// CONFIG
	import { FEATURES } from '@/shared/config.js';

	// COMPONENTS
	import MutationForm from './mutation-form.svelte';

	// UTILS
	import { safeMutation, uploadFileToConvexStorage, uploadFileToR2 } from '@/utils/convexHelpers';
	import { translateFromBackend } from '@/utils/translateFromBackend';
	import { processUploadFields } from './utils.js';

	// TYPES
	import type { Snippet } from 'svelte';
	import type { FunctionReference } from 'convex/server';
	import type {
		MutationFormCustomFields,
		MutationFormFieldDef,
		MutationFormPrepareSubmit,
		MutationFormSection,
		MutationFormStepMeta,
		MutationFormSubmitHandler
	} from './types.js';

	type BackendMessage = Parameters<typeof translateFromBackend>[0];
	type MutationEnvelope = { success: boolean; message: BackendMessage };
	type ConvexFormMutation = FunctionReference<
		'mutation',
		'public',
		Record<string, unknown>,
		unknown
	>;

	let {
		fields,
		sections,
		values = $bindable(),
		initialValues,
		runFunction,
		mapArgs,
		schema,
		onSuccess,
		submitLabel = 'Submit',
		resetOnSuccess = true,
		customFields,
		header,
		extraFields,
		actions,
		class: className,
		wizard = false,
		extraStepMeta,
		backLabel,
		continueLabel
	}: {
		/** Flat field list. Renders as a single plain section. Mutually exclusive with `sections`. */
		fields?: MutationFormFieldDef[];
		/** Grouped sections, each rendered as a Card with a 2-col grid by default. */
		sections?: MutationFormSection[];
		values: T;
		initialValues?: T;
		runFunction: ConvexFormMutation;
		/** Build the mutation payload from the validated values — inject server context (ids,
		    counts) and rename to the mutation's arg names. Defaults to sending the values as-is.
		    `args` is the auto-built `{...values}` after any upload fields have been resolved. */
		mapArgs?: (values: T, args: Record<string, unknown>) => Record<string, unknown>;
		schema: ZodType<T>;
		/** Runs after a successful mutation with the mutation's returned `data` (e.g. to redirect
		    with a returned id). Unlike MutationForm's own `onSuccess`, this sees the result. */
		onSuccess?: (data: unknown, values: T) => void | Promise<void>;
		submitLabel?: string;
		resetOnSuccess?: boolean;
		customFields?: MutationFormCustomFields<T>;
		header?: Snippet;
		extraFields?: Snippet;
		actions?: Snippet<[{ busy: boolean }]>;
		class?: string;
		/** Opt-in: render one section per step with progress + Back/Continue. */
		wizard?: boolean;
		/** Header for the trailing `extraFields` step (wizard only). */
		extraStepMeta?: MutationFormStepMeta;
		backLabel?: string;
		continueLabel?: string;
	} = $props();

	const convex = useConvexClient();

	function hasMutationEnvelope(value: unknown): value is MutationEnvelope {
		return (
			typeof value === 'object' &&
			value !== null &&
			'success' in value &&
			'message' in value &&
			typeof (value as { success: unknown }).success === 'boolean'
		);
	}

	const prepareUploads: MutationFormPrepareSubmit<T> = async ({ sections, args, progress }) => {
		return await processUploadFields({
			sections,
			args,
			progress,
			uploadOne: (file) =>
				FEATURES.USE_R2 ? uploadFileToR2(convex, file) : uploadFileToConvexStorage(convex, file)
		});
	};

	const submitMutation: MutationFormSubmitHandler<T> = async (args, values) => {
		const payload = mapArgs ? mapArgs(values, args) : args;

		let result: Awaited<ReturnType<typeof safeMutation>>;
		try {
			result = await safeMutation(convex, runFunction, payload);
		} catch (error) {
			console.error('[convex-mutation-form] submitMutation failed:', error);
			toast.error(m['GenericMessages.UNEXPECTED_ERROR']());
			return false;
		}

		if (!result) return false;
		if (!hasMutationEnvelope(result)) return true;

		if (!result.success) {
			toast.error(translateFromBackend(result.message));
			return false;
		}

		toast.success(translateFromBackend(result.message));
		// Fire the result-aware hook here, where the mutation result is in scope (MutationForm's
		// own `onSuccess` only gets the values, so a redirect-by-returned-id can't go through it).
		await onSuccess?.((result as { data?: unknown }).data, values);
		return true;
	};
</script>

<MutationForm
	{fields}
	{sections}
	bind:values
	{initialValues}
	onSubmit={submitMutation}
	prepareSubmit={prepareUploads}
	{schema}
	{submitLabel}
	{resetOnSuccess}
	{customFields}
	{header}
	{extraFields}
	{actions}
	class={className}
	{wizard}
	{extraStepMeta}
	{backLabel}
	{continueLabel}
/>
