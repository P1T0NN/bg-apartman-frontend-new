<script lang="ts">
	// I18N
	import { m } from '@/lib/paraglide/messages';

	// LIBRARIES
	import { api } from '@/convex/_generated/api';

	// COMPONENTS
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import Section from '@/components/ui/section/section.svelte';
	import ConvexMutationForm from '@/components/ui/mutation-form/convex-mutation-form.svelte';
	import { Button } from '@/components/ui/button/index.js';
	import ReportHeader from '@/components/pages/(unprotected)/report/report-header.svelte';

	// SCHEMAS
	import {
		createReportSchema,
		type CreateReportInput,
		type ReportCategory
	} from '@/shared/features/report/schemas/reportsSchemas';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type {
		MutationFormFieldSnippetProps,
		MutationFormSection
	} from '@/components/ui/mutation-form/types.js';

	// LUCIDE ICONS
	import BugIcon from '@lucide/svelte/icons/bug';
	import LightbulbIcon from '@lucide/svelte/icons/lightbulb';
	import MessageCircleIcon from '@lucide/svelte/icons/message-circle';
	import SendIcon from '@lucide/svelte/icons/send';

	const categories = $derived([
		{ id: 'bug' as const, label: m['ReportPage.categoryBroken'](), icon: BugIcon },
		{ id: 'idea' as const, label: m['ReportPage.categoryIdea'](), icon: LightbulbIcon },
		{ id: 'other' as const, label: m['ReportPage.categoryOther'](), icon: MessageCircleIcon }
	]);

	const sections = $derived<MutationFormSection[]>([
		{
			plain: true,
			columns: 1,
			fields: [
				{
					id: 'category',
					kind: 'radio',
					label: m['ReportPage.whatsThisAbout']()
				},
				{
					id: 'message',
					kind: 'textarea',
					rows: 6,
					label: m['ReportPage.details'](),
					placeholder: m['ReportPage.detailsPlaceholder'](),
					required: true
				},
				{
					id: 'email',
					kind: 'input',
					type: 'email',
					label: m['ReportPage.emailOptional'](),
					placeholder: m['ReportPage.emailPlaceholder'](),
					description: m['ReportPage.emailDescription'](),
					autocomplete: 'email'
				}
			]
		}
	]);

	let values = $state<CreateReportInput>({
		category: 'bug',
		message: '',
		email: ''
	});
</script>

<SvelteHead title={m['ReportPage.SEO.title']()} description={m['ReportPage.SEO.description']()} />

<!-- min-h-dvh: the page fills the viewport on its own, so the footer only appears once the
     visitor scrolls (a percentage min-h-full can't resolve inside the layout's flex wrapper). -->
<Section class="min-h-dvh" yPadding="lg" containerClass="max-w-xl">
	<ReportHeader />

	<ConvexMutationForm
		class="mt-10"
		{sections}
		bind:values
		schema={createReportSchema}
		runFunction={api.tables.reports.mutations.createReport.createReport}
		customFields={{ category: categoryField }}
	>
		{#snippet actions({ busy }: { busy: boolean })}
			<Button type="submit" size="lg" class="w-full gap-2" disabled={busy}>
				<SendIcon class="size-4" />
				{m['ReportPage.sendReport']()}
			</Button>
		{/snippet}
	</ConvexMutationForm>
</Section>

{#snippet categoryField({ value, setValue }: MutationFormFieldSnippetProps<CreateReportInput>)}
	{@const selected = value as ReportCategory}
	<div class="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
		{#each categories as category (category.id)}
			{@const Icon = category.icon}
			{@const active = selected === category.id}
			<button
				type="button"
				aria-pressed={active}
				onclick={() => setValue(category.id)}
				class={cn(
					'flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
					active
						? 'border-primary/40 bg-primary/5 text-foreground'
						: 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
				)}
			>
				<Icon class={cn('size-5', active ? 'text-primary' : 'text-muted-foreground')} />
				<span class="text-sm font-medium">{category.label}</span>
			</button>
		{/each}
	</div>
{/snippet}
