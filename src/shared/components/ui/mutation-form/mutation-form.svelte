<script lang="ts" generics="T extends Record<string, unknown>">
	// LIBRARIES
	import { tick } from 'svelte';
	import { fade } from 'svelte/transition';
	import { toast } from 'svelte-sonner';
	import { type ZodType } from 'zod';
	import { m } from '@/shared/lib/paraglide/messages.js';

	// COMPONENTS
	import { Button } from '@/shared/components/ui/button/index.js';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent
	} from '@/shared/components/ui/card/index.js';
	import {
		FieldGroup,
		Field,
		FieldSet,
		FieldLegend,
		FieldLabel,
		FieldDescription,
		FieldError
	} from '@/shared/components/ui/field/index.js';
	import InputField from './input-field.svelte';
	import TimeInput from '@/shared/components/ui/time-input/time-input.svelte';
	import CounterField from './counter-field.svelte';
	import TextareaField from './textarea-field.svelte';
	import SelectField from './select-field.svelte';
	import CheckboxField from './checkbox-field.svelte';
	import RadioGroupField from './radio-group-field.svelte';
	import ToggleTileField from './toggle-tile-field.svelte';
	import UploadField from './upload-field.svelte';

	// UTILS
	import { cn } from '@/utils/utils.js';
	import { zodIssuesToFieldErrors } from '@/shared/utils/zodFieldErrors';
	import { focusFirstError } from '@/utils/focusFirstError.js';
	import { useProgress } from '@/features/uploadFile/utils/useProgress.svelte';
	import { Progress } from '@/shared/components/ui/progress/index.js';
	import { hasUploadFields } from './utils.js';

	// LUCIDE ICONS
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';

	// TYPES
	import type { Snippet } from 'svelte';
	import type {
		MutationFormCustomFields,
		MutationFormFieldDef,
		MutationFormFieldErrors,
		MutationFormPrepareSubmit,
		MutationFormSection,
		MutationFormStepMeta,
		MutationFormSubmitHandler
	} from './types.js';

	let {
		fields,
		sections,
		values = $bindable(),
		initialValues,
		onSubmit,
		prepareSubmit,
		schema,
		onSuccess,
		submitLabel = 'Submit',
		resetOnSuccess = true,
		customFields,
		header,
		extraFields,
		actions,
		class: className,
		/** Opt-in: render one section per step with progress + Back/Continue. */
		wizard = false,
		/** Header for the trailing `extraFields` step (wizard only). */
		extraStepMeta,
		backLabel = 'Back',
		continueLabel = 'Continue'
	}: {
		/** Flat field list. Renders as a single plain section. Mutually exclusive with `sections`. */
		fields?: MutationFormFieldDef[];
		/** Grouped sections, each rendered as a Card with a 2-col grid by default. */
		sections?: MutationFormSection[];
		values: T;
		initialValues?: T;
		onSubmit: MutationFormSubmitHandler<T>;
		prepareSubmit?: MutationFormPrepareSubmit<T>;
		schema: ZodType<T>;
		onSuccess?: (values: T) => void;
		submitLabel?: string;
		resetOnSuccess?: boolean;
		customFields?: MutationFormCustomFields<T>;
		header?: Snippet;
		extraFields?: Snippet;
		actions?: Snippet<[{ busy: boolean }]>;
		class?: string;
		wizard?: boolean;
		extraStepMeta?: MutationFormStepMeta;
		backLabel?: string;
		continueLabel?: string;
	} = $props();

	const id = $props.id();
	const progress = useProgress();

	// svelte-ignore state_referenced_locally
	const resetSnapshot: T = $state.snapshot(initialValues ?? values) as T;

	let fieldErrors = $state<MutationFormFieldErrors<T>>({});
	let busy = $state(false);
	let formEl = $state<HTMLFormElement | null>(null);

	// Focus the step region after a navigation (not on first load, so the
	// basics step's `autofocus` input keeps the focus).
	let hasNavigated = false;
	function focusOnNav(node: HTMLElement) {
		if (hasNavigated) node.focus({ preventScroll: true });
	}

	const resolvedSections = $derived<MutationFormSection[]>(
		sections ?? (fields ? [{ fields, plain: true }] : [])
	);

	function getValue(key: string): unknown {
		return (values as Record<string, unknown>)[key];
	}

	function setValue(key: string, next: unknown) {
		(values as Record<string, unknown>)[key] = next;
		if (key in fieldErrors) {
			const copy = { ...fieldErrors };
			delete copy[key as keyof T & string];
			fieldErrors = copy;
		}
	}

	function spanClass(field: MutationFormFieldDef, columns: 1 | 2) {
		if (columns === 1) return '';
		return (field.colSpan ?? 2) === 1 ? 'sm:col-span-1' : 'sm:col-span-2';
	}

	/* ---------------------------------------------------------------------- */
	/* Wizard state — one step per section, plus a trailing `extraFields` step */
	/* ---------------------------------------------------------------------- */

	type WizardStep =
		| { kind: 'section'; section: MutationFormSection }
		| { kind: 'extra'; meta?: MutationFormStepMeta };

	const wizardSteps = $derived<WizardStep[]>([
		...resolvedSections.map((section): WizardStep => ({ kind: 'section', section })),
		...(extraFields ? [{ kind: 'extra', meta: extraStepMeta } as WizardStep] : [])
	]);

	let currentStep = $state(0);
	const lastIndex = $derived(Math.max(0, wizardSteps.length - 1));
	const isLastStep = $derived(currentStep >= lastIndex);
	const currentWizardStep = $derived(wizardSteps[Math.min(currentStep, lastIndex)]);

	const currentMeta = $derived.by<MutationFormStepMeta>(() => {
		const step = currentWizardStep;
		if (!step) return {};
		return step.kind === 'extra'
			? (step.meta ?? {})
			: {
					title: step.section.title,
					description: step.section.description,
					icon: step.section.icon
				};
	});

	function stepFieldIds(index: number): string[] {
		const step = wizardSteps[index];
		return step && step.kind === 'section' ? step.section.fields.map((f) => f.id) : [];
	}

	function computeFieldErrors(snapshot: T): MutationFormFieldErrors<T> {
		const result = schema.safeParse(snapshot);
		if (result.success) return {};
		return zodIssuesToFieldErrors<keyof T & string>(result.error.issues);
	}

	function pickErrors(all: MutationFormFieldErrors<T>, ids: string[]): MutationFormFieldErrors<T> {
		const out: MutationFormFieldErrors<T> = {};
		for (const fid of ids) {
			const key = fid as keyof T & string;
			if (all[key]) out[key] = all[key];
		}
		return out;
	}

	async function scrollToTop() {
		await tick();
		formEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}

	function advanceStep() {
		const snapshot = $state.snapshot(values) as T;
		const stepErrors = pickErrors(computeFieldErrors(snapshot), stepFieldIds(currentStep));
		if (Object.keys(stepErrors).length > 0) {
			fieldErrors = stepErrors;
			toast.error(m['GenericMessages.YOU_NEED_TO_CORRECT_FORM_ERRORS']());
			void focusFirstError(formEl);
			return;
		}
		fieldErrors = {};
		hasNavigated = true;
		currentStep = Math.min(currentStep + 1, lastIndex);
		void scrollToTop();
	}

	function goBack() {
		if (currentStep === 0) return;
		fieldErrors = {};
		hasNavigated = true;
		currentStep -= 1;
		void scrollToTop();
	}

	function goToStep(index: number) {
		// Free backward navigation; forward only through validated Continue.
		if (index >= currentStep || index < 0) return;
		fieldErrors = {};
		hasNavigated = true;
		currentStep = index;
		void scrollToTop();
	}

	async function submitForm() {
		const valueSnapshot = $state.snapshot(values) as T;
		const validation = schema.safeParse(valueSnapshot);
		if (!validation.success) {
			fieldErrors = zodIssuesToFieldErrors<keyof T & string>(validation.error.issues);
			toast.error(m['GenericMessages.YOU_NEED_TO_CORRECT_FORM_ERRORS']());
			// In wizard mode, jump back to the first step that still has an error.
			if (wizard) {
				const firstBad = wizardSteps.findIndex(
					(step) =>
						step.kind === 'section' &&
						step.section.fields.some((f) => fieldErrors[f.id as keyof T & string])
				);
				if (firstBad >= 0) {
					hasNavigated = true;
					currentStep = firstBad;
				}
			}
			// Jump to the first invalid field (after the wizard re-renders the bad step).
			void focusFirstError(formEl);
			return;
		}
		fieldErrors = {};

		busy = true;
		progress.start();

		try {
			const args = { ...valueSnapshot } as Record<string, unknown>;

			const prepared = await prepareSubmit?.({
				values: valueSnapshot,
				sections: resolvedSections,
				args,
				progress
			});
			if (prepared === false) return;
			progress.markDone();

			const submitted = await onSubmit(args, valueSnapshot);
			if (submitted === false) return;
			onSuccess?.($state.snapshot(values) as T);
			if (resetOnSuccess) {
				values = structuredClone(resetSnapshot);
				currentStep = 0;
			}
		} finally {
			busy = false;
			progress.clear();
		}
	}

	function onFormSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (wizard && !isLastStep) {
			advanceStep();
			return;
		}
		void submitForm();
	}

	const showUploadProgress = $derived(hasUploadFields(resolvedSections));
</script>

{#snippet renderField(field: MutationFormFieldDef)}
	{@const inputId = `${field.id}-${id}`}
	{@const err = fieldErrors[field.id as keyof T & string]}
	{@const custom = customFields?.[field.id]}

	{#if field.kind === 'checkbox' && !custom}
		<Field orientation="horizontal" class={field.fieldClass}>
			<CheckboxField
				{field}
				{inputId}
				value={getValue(field.id)}
				setValue={(v) => setValue(field.id, v)}
				invalid={!!err}
			/>
			<FieldLabel for={inputId}>{field.label}</FieldLabel>
			{#if err}
				<FieldError>{err}</FieldError>
			{:else if field.description}
				<FieldDescription>{field.description}</FieldDescription>
			{/if}
		</Field>
	{:else if field.kind === 'radio' && !custom}
		<FieldSet class={field.fieldClass}>
			<FieldLegend variant="label">{field.label}</FieldLegend>
			<RadioGroupField
				{field}
				{inputId}
				value={getValue(field.id)}
				setValue={(v) => setValue(field.id, v)}
				invalid={!!err}
			/>
			{#if err}
				<FieldError>{err}</FieldError>
			{:else if field.description}
				<FieldDescription>{field.description}</FieldDescription>
			{/if}
		</FieldSet>
	{:else if field.kind === 'toggle' && !custom}
		<ToggleTileField
			{field}
			{inputId}
			value={getValue(field.id)}
			setValue={(v) => setValue(field.id, v)}
		/>
	{:else}
		<Field class={field.fieldClass}>
			<FieldLabel for={inputId}>{field.label}</FieldLabel>
			{#if custom}
				{@render custom({
					field,
					value: getValue(field.id) as T[keyof T],
					setValue: (next) => setValue(field.id, next),
					error: err,
					inputId
				})}
			{:else if field.kind === 'time'}
				<TimeInput
					id={inputId}
					value={getValue(field.id) as string}
					setValue={(v) => setValue(field.id, v)}
					placeholder={field.placeholder}
					disabled={field.disabled}
					invalid={!!err}
				/>
			{:else if field.kind === 'counter'}
				<CounterField
					{field}
					{inputId}
					value={getValue(field.id)}
					setValue={(v) => setValue(field.id, v)}
					invalid={!!err}
				/>
			{:else if field.kind === 'textarea'}
				<TextareaField
					{field}
					{inputId}
					value={getValue(field.id)}
					setValue={(v) => setValue(field.id, v)}
					invalid={!!err}
				/>
			{:else if field.kind === 'upload-single' || field.kind === 'upload-multiple'}
				<UploadField
					{field}
					{inputId}
					value={getValue(field.id)}
					setValue={(v) => setValue(field.id, v)}
				/>
			{:else if field.kind === 'select'}
				<SelectField
					{field}
					{inputId}
					value={getValue(field.id)}
					setValue={(v) => setValue(field.id, v)}
					invalid={!!err}
				/>
			{:else}
				<InputField
					{field}
					{inputId}
					value={getValue(field.id)}
					setValue={(v) => setValue(field.id, v)}
					invalid={!!err}
				/>
			{/if}
			{#if err}
				<FieldError>{err}</FieldError>
			{:else if field.description}
				<FieldDescription>{field.description}</FieldDescription>
			{/if}
		</Field>
	{/if}
{/snippet}

{#snippet renderGrid(section: MutationFormSection)}
	{@const columns = section.columns ?? 2}
	<div class={cn('grid gap-4', columns === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1')}>
		{#each section.fields as field (field.id)}
			<div class={spanClass(field, columns)}>
				{@render renderField(field)}
			</div>
		{/each}
	</div>
{/snippet}

{#snippet stepHeader(meta: MutationFormStepMeta)}
	<div class="flex items-start gap-3.5">
		{#if meta.icon}
			{@const Icon = meta.icon}
			<span
				class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
			>
				<Icon class="size-5" />
			</span>
		{/if}
		<div class="min-w-0 flex-1">
			{#if meta.title}
				<h2 class="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
					{meta.title}
				</h2>
			{/if}
			{#if meta.description}
				<p class="mt-1 text-sm text-muted-foreground">{meta.description}</p>
			{/if}
		</div>
	</div>
{/snippet}

{#snippet wizardBody()}
	<div class="rounded-2xl border bg-card p-5 shadow-sm sm:p-7">
		<!-- Progress -->
		<div class="flex flex-col gap-2">
			<div class="flex items-center justify-end">
				<span class="text-xs font-medium text-muted-foreground tabular-nums">
					Step {currentStep + 1} of {wizardSteps.length}
				</span>
			</div>
			<div class="flex items-center gap-1.5" role="group" aria-label="Progress">
				{#each wizardSteps, i (i)}
					<button
						type="button"
						aria-label={`Go to step ${i + 1}`}
						aria-current={i === currentStep ? 'step' : undefined}
						disabled={i >= currentStep}
						onclick={() => goToStep(i)}
						class={cn(
							'h-1.5 flex-1 rounded-full transition-all duration-300',
							i < currentStep && 'cursor-pointer bg-primary hover:opacity-70',
							i === currentStep && 'bg-primary',
							i > currentStep && 'bg-muted'
						)}
					></button>
				{/each}
			</div>
		</div>

		<!-- Current step -->
		{#key currentStep}
			<div
				class="mt-7 outline-none"
				role="group"
				aria-label={currentMeta.title}
				tabindex="-1"
				use:focusOnNav
				in:fade={{ duration: 160 }}
			>
				{@render stepHeader(currentMeta)}
				<div class="mt-6">
					{#if currentWizardStep?.kind === 'extra'}
						{@render extraFields?.()}
					{:else if currentWizardStep}
						{@render renderGrid(currentWizardStep.section)}
					{/if}
				</div>
			</div>
		{/key}

		{#if busy && showUploadProgress}
			<div class="mt-6 flex w-full flex-col gap-2">
				<Progress value={progress.percent} class="h-2" />
				<p class="text-xs text-muted-foreground tabular-nums">{progress.label}</p>
			</div>
		{/if}

		<!-- Footer -->
		<div class="mt-8 flex items-center gap-3 border-t pt-5">
			{#if currentStep > 0}
				<Button type="button" variant="ghost" onclick={goBack} disabled={busy}>
					<ArrowLeftIcon class="size-4" />
					{backLabel}
				</Button>
			{/if}
			<Button type="submit" class="ml-auto min-w-36" disabled={busy}>
				{#if isLastStep}
					{submitLabel}
				{:else}
					{continueLabel}
					<ArrowRightIcon class="size-4" />
				{/if}
			</Button>
		</div>
	</div>
{/snippet}

<!--
	`novalidate` hands validation entirely to the Zod `safeParse` in `submitForm`.
	Without it, the browser's native constraint check (from `required` etc.) fires
	first, blocks the submit event, and shows its default bubble — so our
	`<FieldError>` messages would never render.
-->
<form
	bind:this={formEl}
	onsubmit={onFormSubmit}
	novalidate
	class={cn('flex scroll-mt-6 flex-col gap-6', className)}
>
	{@render header?.()}

	{#if wizard}
		{@render wizardBody()}
	{:else}
		{#each resolvedSections as section, i (section.id ?? i)}
			{#if section.plain}
				<FieldGroup class={section.class}>
					{#if section.title}
						<FieldSet>
							<FieldLegend>{section.title}</FieldLegend>
							{#if section.description}
								<FieldDescription>{section.description}</FieldDescription>
							{/if}
						</FieldSet>
					{/if}
					{@render renderGrid(section)}
				</FieldGroup>
			{:else}
				<Card class={section.class}>
					{#if section.title || section.description}
						<CardHeader>
							{#if section.title}
								<CardTitle>{section.title}</CardTitle>
							{/if}
							{#if section.description}
								<CardDescription>{section.description}</CardDescription>
							{/if}
						</CardHeader>
					{/if}
					<CardContent>
						{@render renderGrid(section)}
					</CardContent>
				</Card>
			{/if}
		{/each}

		{@render extraFields?.()}

		{#if busy && showUploadProgress}
			<div class="flex w-full flex-col gap-2">
				<Progress value={progress.percent} class="h-2" />
				<p class="text-xs text-muted-foreground tabular-nums">{progress.label}</p>
			</div>
		{/if}

		{#if actions}
			{@render actions({ busy })}
		{:else}
			<Button type="submit" class="w-full" disabled={busy}>{submitLabel}</Button>
		{/if}
	{/if}
</form>
