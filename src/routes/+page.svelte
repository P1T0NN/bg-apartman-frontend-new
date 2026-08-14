<script lang="ts">
	// I18N
	import { m } from '@/lib/paraglide/messages';

	// COMPONENTS
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import HeroSection from '@/components/pages/(unprotected)/root/hero-section/hero-section.svelte';
	import FeaturedAccommodationsSection from '@/components/pages/(unprotected)/root/featured-accommodations-section.svelte';
	import WhyUsSection from '@/components/pages/(unprotected)/root/why-us-section.svelte';
	import TestimonialsSection from '@/components/pages/(unprotected)/root/testimonials-section.svelte';
	import BecomeHostSection from '@/components/pages/(unprotected)/root/become-host-section.svelte';
	import NewslettersSection from '@/components/pages/(unprotected)/root/newsletters-section.svelte';
</script>

<SvelteHead
	title={m['HomePage.SEO.title']()}
	description={m['HomePage.SEO.description']()}
	image="/opengraph-image.png"
/>

<HeroSection />
<FeaturedAccommodationsSection />
<BecomeHostSection />
<WhyUsSection />
<TestimonialsSection />
<NewslettersSection />
