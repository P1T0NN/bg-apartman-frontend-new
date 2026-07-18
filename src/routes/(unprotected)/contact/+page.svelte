<script lang="ts">
	// CONFIG
	import { COMPANY_DATA } from '@/shared/constants.js';

	// COMPONENTS
	import SvelteHead from '@/shared/components/ui/svelte-head/svelte-head.svelte';
	import MutationForm from '@/shared/components/ui/mutation-form/mutation-form.svelte';
	import { toast } from 'svelte-sonner';

	// ACTIONS
	import { sendContactFormEmail } from '@/features/contact/actions/contactActions.remote';

	// SCHEMAS
	import {
		sendContactFormEmailSchema,
		type SendContactFormEmailSchema
	} from '@/features/contact/schemas/contactSchemas';

	// SVGS
	import InstagramIcon from '@/svgs/instagram.svelte';
	import FacebookIcon from '@/svgs/facebook.svelte';
	import YoutubeIcon from '@/svgs/youtube.svelte';
	import TikTokIcon from '@/svgs/tiktok.svelte';

	// TYPES
	import type { MutationFormSection } from '@/shared/components/ui/mutation-form/types';
	import type { ZodType } from 'zod';

	// LUCIDE ICONS
	import MailIcon from '@lucide/svelte/icons/mail';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import ClockIcon from '@lucide/svelte/icons/clock';

	type ContactValues = Pick<SendContactFormEmailSchema, 'name' | 'email' | 'message'>;

	let values = $state<ContactValues>({ name: '', email: '', message: '' });

	const contactSections: MutationFormSection[] = [
		{
			plain: true,
			columns: 1,
			fields: [
				{
					id: 'name',
					label: 'Your name',
					kind: 'input',
					placeholder: 'Marko Marković',
					autocomplete: 'name'
				},
				{
					id: 'email',
					label: 'Email',
					kind: 'input',
					type: 'email',
					placeholder: 'you@example.com',
					autocomplete: 'email'
				},
				{
					id: 'message',
					label: 'How can we help?',
					kind: 'textarea',
					placeholder: 'Tell us a little about what you need — dates, a place you saw, or a question.',
					rows: 6
				}
			]
		}
	];

	const contactDetails = [
		{
			icon: MailIcon,
			label: 'Email us',
			value: COMPANY_DATA.EMAIL,
			href: `mailto:${COMPANY_DATA.EMAIL}`
		},
		{ icon: MapPinIcon, label: 'Where we are', value: 'Belgrade, Serbia' },
		{ icon: ClockIcon, label: 'Typical reply', value: 'Within one business day' }
	];

	const socials = [
		{ icon: InstagramIcon, href: COMPANY_DATA.INSTAGRAM_URL, label: 'Instagram' },
		{ icon: FacebookIcon, href: COMPANY_DATA.FACEBOOK_URL, label: 'Facebook' },
		{ icon: TikTokIcon, href: COMPANY_DATA.TIKTOK_URL, label: 'TikTok' },
		{ icon: YoutubeIcon, href: COMPANY_DATA.YOUTUBE_URL, label: 'YouTube' }
	];

	// Client-side validation runs first (MutationForm), then the BotID-guarded remote command
	// sends the email. Returning `false` keeps the form filled; `true` lets it reset on success.
	async function handleSubmit(_args: Record<string, unknown>, submitted: ContactValues) {
		try {
			const result = await sendContactFormEmail(submitted);

			if (!result.success) {
				toast.error(result.message);
				return false;
			}

			toast.success(result.message);
			return true;
		} catch {
			toast.error(`Something went wrong. Please try again or email us at ${COMPANY_DATA.EMAIL}.`);
			return false;
		}
	}
</script>

<SvelteHead
	title="Contact — {COMPANY_DATA.NAME}"
	description="Questions about a stay, a booking or hosting in Belgrade? Send us a message or email us directly — we usually reply within one business day."
/>

<div class="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
	<!-- Heading -->
	<div class="max-w-2xl">
		<p class="text-xs font-semibold tracking-[0.22em] text-primary uppercase">Contact</p>
		<h1
			class="mt-4 font-display text-4xl font-medium tracking-tight text-balance text-foreground sm:text-5xl"
		>
			Talk to a real person
		</h1>
		<p class="mt-4 text-lg text-pretty text-muted-foreground">
			Whether it's a question about a booking, a place you have your eye on, or hosting your own
			apartment — we read every message and reply personally.
		</p>
	</div>

	<div class="mt-14 grid gap-12 lg:mt-16 lg:grid-cols-[5fr_7fr] lg:gap-16">
		<!-- Info column -->
		<div class="lg:pt-2">
			<dl class="space-y-6">
				{#each contactDetails as detail (detail.label)}
					<div class="flex items-start gap-4">
						<span
							class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
						>
							<detail.icon class="size-5" aria-hidden="true" />
						</span>
						<div>
							<dt class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
								{detail.label}
							</dt>
							<dd class="mt-1 text-base font-medium text-foreground">
								{#if detail.href}
									<a href={detail.href} class="transition-colors hover:text-primary">
										{detail.value}
									</a>
								{:else}
									{detail.value}
								{/if}
							</dd>
						</div>
					</div>
				{/each}
			</dl>

			<div class="mt-10 border-t border-border pt-8">
				<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Follow along</p>
				<div class="mt-4 flex gap-3">
					{#each socials as social (social.label)}
						<a
							href={social.href}
							target="_blank"
							rel="noopener noreferrer"
							aria-label={social.label}
							class="flex size-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
						>
							<social.icon class="size-4" />
						</a>
					{/each}
				</div>
			</div>
		</div>

		<!-- Form card -->
		<div class="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
			<MutationForm
				bind:values
				sections={contactSections}
				schema={sendContactFormEmailSchema as unknown as ZodType<ContactValues>}
				onSubmit={handleSubmit}
				submitLabel="Send message"
			>
				{#snippet header()}
					<div>
						<h2 class="text-xl font-semibold tracking-tight text-foreground">Send us a message</h2>
						<p class="mt-1.5 text-sm text-muted-foreground">
							Fill in the form and we'll get back to you by email.
						</p>
					</div>
				{/snippet}
			</MutationForm>
		</div>
	</div>
</div>
