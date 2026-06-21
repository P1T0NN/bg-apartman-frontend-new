<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';

	// CONFIG
	import { COMPANY_DATA } from '@/shared/constants';

	// LUCIDE ICONS
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import MailIcon from '@lucide/svelte/icons/mail';
</script>

<div>
	<p class="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-primary-foreground/60">{m['ContactSection.ContactLeftContent.contact']()}</p>

	<h2
		id="contact-heading"
		class="text-4xl font-normal leading-[1.05] text-primary-foreground md:text-5xl"
	>
		Let's plan<br />
		<span class="font-serif italic">your makeup</span>
	</h2>

	<p class="mt-6 max-w-sm text-base leading-relaxed text-primary-foreground/70">
		Whether it's a wedding in Valencia, a special event, or a trial before the big day — tell Teresa
		what you have in mind. She reads every message and usually replies within 24 hours.
	</p>

	<div class="my-10 h-px bg-linear-to-r from-primary-foreground/20 to-transparent"></div>

	<p class="mb-5 text-sm text-primary-foreground/60">{m['ContactSection.ContactLeftContent.preferEmail']()}</p>

	<div class="flex flex-col gap-4">
		<a
			href={`mailto:${COMPANY_DATA.EMAIL}`}
			rel="external"
			class="group inline-flex items-center gap-2 text-sm font-semibold text-primary-foreground transition-colors hover:text-primary-foreground/70"
		>
			<MailIcon class="h-4 w-4 text-primary-foreground" />
			{COMPANY_DATA.EMAIL}
			<ArrowRightIcon class="h-4 w-4 transition-transform group-hover:translate-x-1" />
		</a>
	</div>
</div>