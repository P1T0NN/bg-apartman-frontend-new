<script lang="ts">
	// COMPONENTS
	import SvelteHead from '@/shared/components/ui/svelte-head/svelte-head.svelte';
	import HeroSection from '@/shared/components/pages/(unprotected)/root/hero-section/hero-section.svelte';
	import FeaturedAccommodationsSection from '@/shared/components/pages/(unprotected)/root/featured-accommodations-section.svelte';
	import WhyUsSection from '@/shared/components/pages/(unprotected)/root/why-us-section.svelte';
	import TestimonialsSection from '@/shared/components/pages/(unprotected)/root/testimonials-section.svelte';
	import BecomeHostSection from '@/shared/components/pages/(unprotected)/root/become-host-section.svelte';
	import NewslettersSection from '@/shared/components/pages/(unprotected)/root/newsletters-section.svelte';
</script>

<SvelteHead
	title="Handpicked apartments — find & book your stay"
	description="Handpicked apartments for a night, a week, or a whole season. Search, compare and book your stay in minutes — clear pricing, instant confirmation, local support."
	image="/opengraph-image.png"
/>

<HeroSection />
<FeaturedAccommodationsSection />
<BecomeHostSection />
<WhyUsSection />
<TestimonialsSection />
<NewslettersSection />
