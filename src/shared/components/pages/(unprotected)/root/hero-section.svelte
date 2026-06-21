<script lang="ts">
	import Section from '@/shared/components/ui/section/section.svelte';
</script>

<Section yPadding="none" containerClass="flex min-h-dvh flex-col items-center justify-center gap-4 text-center sm:gap-6">
	<h1 class="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
		Welcome to SvelteKit
	</h1>
	<p class="text-muted-foreground max-w-prose text-base sm:text-lg">
		Visit
		<a
			class="text-primary font-medium underline-offset-4 hover:underline"
			href="https://svelte.dev/docs/kit"
			rel="noopener noreferrer"
			target="_blank"
		>
			svelte.dev/docs/kit
		</a>
		to read the documentation
	</p>
</Section>
