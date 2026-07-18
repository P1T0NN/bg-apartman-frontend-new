<script lang="ts">
	// COMPONENTS
	import HeroSectionSearch from './hero-section-search.svelte';
</script>

<section class="relative min-h-svh overflow-hidden bg-hero-overlay">
	<!-- Background Image with Overlay -->
	<div class="absolute inset-0">
		<img
			src="/root/hero-image.webp"
			alt=""
			fetchpriority="high"
			class="h-full w-full object-cover opacity-40"
		/>
		<div
			class="absolute inset-0 bg-linear-to-b from-hero-overlay/60 via-hero-overlay/40 to-hero-overlay"
		></div>
	</div>

	<!-- Content -->
	<div
		class="relative z-10 flex min-h-svh flex-col justify-end px-4 pt-24 pb-8 sm:px-6 lg:justify-center lg:px-8 lg:pt-0 lg:pb-0"
	>
		<div class="mx-auto w-full max-w-7xl">
			<!-- Trust Indicators -->
			<div class="hero-item mb-6 flex flex-wrap items-center gap-4 lg:mb-8">
				<div class="flex items-center gap-2 text-sm text-hero-overlay-foreground/90">
					<span class="font-semibold">Handpicked</span>
					<span class="text-hero-overlay-foreground/70">apartments</span>
				</div>

				<div class="hidden h-4 w-px bg-hero-overlay-foreground/30 sm:block"></div>

				<div class="flex items-center gap-2 text-sm text-hero-overlay-foreground/90">
					<span class="font-semibold">Simple</span>
					<span class="text-hero-overlay-foreground/70">booking</span>
				</div>

				<div class="hidden h-4 w-px bg-hero-overlay-foreground/30 sm:block"></div>

				<div class="flex items-center gap-2 text-sm text-hero-overlay-foreground/90">
					<span class="font-semibold">Local</span>
					<span class="text-hero-overlay-foreground/70">support</span>
				</div>
			</div>

			<!-- Headline -->
			<h1
				class="hero-item mb-6 font-display text-4xl leading-[1.1] font-bold tracking-tight text-hero-overlay-foreground sm:text-5xl lg:mb-8 lg:max-w-3xl lg:text-7xl"
				style="animation-delay: 100ms"
			>
				<span class="text-balance">
					Feel at home, <span class="text-primary italic">wherever you stay.</span>
				</span>
			</h1>

			<!-- Subheadline -->
			<p
				class="hero-item mb-8 max-w-xl text-base leading-relaxed text-hero-overlay-foreground/70 lg:mb-12 lg:text-lg"
				style="animation-delay: 200ms"
			>
				Handpicked apartments for a night, a week, or a whole season — booked in minutes, no
				back-and-forth.
			</p>

			<HeroSectionSearch />
		</div>
	</div>
</section>

<style>
	@keyframes heroUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	.hero-item {
		animation: heroUp 0.6s ease-out both;
	}

	@media (prefers-reduced-motion: reduce) {
		.hero-item {
			animation: none;
		}
	}
</style>
