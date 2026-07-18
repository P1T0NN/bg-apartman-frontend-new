<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';

	// COMPONENTS
	import Section from '@/shared/components/ui/section/section.svelte';
	import ConvexMutationForm from '@/shared/components/ui/mutation-form/convex-mutation-form.svelte';
	import Input from '@/shared/components/ui/input/input.svelte';
	import Button from '@/shared/components/ui/button/button.svelte';

	// SCHEMAS
	import { newsletterSchema } from '@/features/newsletters/schemas/newsletterSchemas';

	// FORMS
	import { subscribeToNewsletterForm } from '@/features/newsletters/forms/subscribeToNewsletterForm';

	// LUCIDE ICONS
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';

	let values = $state({ email: '' });
</script>

<Section
	id="newsletters"
	class="newsletter-section scroll-mt-14 relative isolate overflow-hidden bg-foreground [content-visibility:auto] [contain-intrinsic-size:auto_500px]"
	yPadding="xl"
	contain={false}
>
	<!-- Decorative background elements -->
	<div class="pointer-events-none absolute inset-0">
		<div class="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl"></div>
		<div class="absolute -right-16 -bottom-16 h-64 w-64 rounded-full bg-primary/8 blur-3xl"></div>
		<div
			class="absolute top-0 left-1/2 h-px w-2/3 -translate-x-1/2 bg-linear-to-r from-transparent via-primary/20 to-transparent"
		></div>
	</div>

	<!-- Subtle grid pattern overlay -->
	<div
		class="pointer-events-none absolute inset-0 opacity-[0.03]"
		style="background-image: url(&quot;data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E&quot;)"
	></div>

	<div class="relative mx-auto max-w-2xl px-6 lg:px-8">
		<!-- Eyebrow label -->
		<div class="mb-6 flex items-center justify-center gap-2">
			<span class="h-px w-8 bg-primary/40"></span>
			<span class="text-xs font-medium tracking-[0.2em] text-primary/70 uppercase">Newsletter</span>
			<span class="h-px w-8 bg-primary/40"></span>
		</div>

		<!-- Title -->
		<h2
			class="text-center font-serif text-3xl font-bold tracking-tight text-background sm:text-4xl lg:text-5xl"
		>
			Stay in the loop
		</h2>

		<!-- Description -->
		<p
			class="mx-auto mt-4 max-w-lg text-center text-sm leading-relaxed text-background/60 lg:text-base"
		>
			Get the best apartments, seasonal deals and Belgrade travel tips delivered straight to your
			inbox.
		</p>

		<!-- Form area -->
		<div class="mt-10">
			<ConvexMutationForm
				bind:values
				schema={newsletterSchema}
				runFunction={api.tables.newsletter.mutations.subscribeToNewsletters.subscribeToNewsletter}
				class="gap-3 sm:flex-row sm:items-start"
				sections={subscribeToNewsletterForm}
				customFields={{ email: emailField }}
				actions={subscribeButton}
			/>
		</div>

		<!-- Disclaimer -->
		<p class="mt-5 text-center text-xs leading-relaxed text-background/40 sm:text-left">
			By subscribing you agree to receive occasional emails. Unsubscribe anytime.
		</p>

		<!-- Decorative bottom element -->
		<div class="mt-12 flex items-center justify-center gap-1.5">
			<span class="h-1 w-1 rounded-full bg-primary/30"></span>
			<span class="h-1 w-1 rounded-full bg-primary/50"></span>
			<span class="h-1 w-1 rounded-full bg-primary/30"></span>
		</div>
	</div>
</Section>

{#snippet emailField({
	value,
	setValue,
	error,
	inputId
}: {
	value: unknown;
	setValue: (next: unknown) => void;
	error: string | undefined;
	inputId: string;
})}
	<Input
		id={inputId}
		type="email"
		aria-label="Email address"
		placeholder="Enter your email"
		autocomplete="email"
		value={value as string}
		oninput={(e) => setValue(e.currentTarget.value)}
		aria-invalid={!!error}
		class="h-12 rounded-lg border-background/10 bg-background/5 text-background backdrop-blur-sm transition-colors duration-200 placeholder:text-background/30 focus:border-primary focus:bg-background/10 focus:ring-primary/20 {error
			? 'border-destructive'
			: ''}"
	/>
	{#if error}
		<p class="text-sm text-destructive">{error}</p>
	{/if}
{/snippet}

{#snippet subscribeButton({ busy }: { busy: boolean })}
	<Button
		type="submit"
		disabled={busy}
		class="h-12 shrink-0 rounded-lg bg-primary px-8 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-[background-color,box-shadow,transform,opacity] duration-200 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
	>
		{#if busy}
			<LoaderCircleIcon class="mr-2 inline-block h-4 w-4 animate-spin" />
			Subscribing...
		{:else}
			Subscribe
			<ArrowRightIcon class="ml-2 inline-block h-4 w-4 transition-transform duration-200" />
		{/if}
	</Button>
{/snippet}
