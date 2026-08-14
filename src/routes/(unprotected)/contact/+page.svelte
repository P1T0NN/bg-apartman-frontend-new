<script lang="ts">
	// I18N
	import { m } from '@/paraglide/messages';

	// CONFIG
	import { COMPANY_DATA } from '@/shared/config.js';

	// COMPONENTS
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import MutationForm from '@/components/ui/mutation-form/mutation-form.svelte';
	import { toast } from 'svelte-sonner';

	// ACTIONS
	import { sendContactFormEmail } from '@/features/contact/actions/contactActions.remote';

	// SCHEMAS
	import {
		sendContactFormEmailSchema,
		type SendContactFormEmailSchema
	} from '@/shared/features/contact/schemas/contactSchemas';

	// SVGS
	import InstagramIcon from '@/svgs/instagram.svelte';
	import FacebookIcon from '@/svgs/facebook.svelte';
	import YoutubeIcon from '@/svgs/youtube.svelte';
	import TikTokIcon from '@/svgs/tiktok.svelte';

	// TYPES
	import type { MutationFormSection } from '@/components/ui/mutation-form/types';
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
					label: m['ContactPage.nameLabel'](),
					kind: 'input',
					placeholder: m['ContactPage.namePlaceholder'](),
					autocomplete: 'name'
				},
				{
					id: 'email',
					label: m['ContactPage.emailLabel'](),
					kind: 'input',
					type: 'email',
					placeholder: m['ContactPage.emailPlaceholder'](),
					autocomplete: 'email'
				},
				{
					id: 'message',
					label: m['ContactPage.messageLabel'](),
					kind: 'textarea',
					placeholder: m['ContactPage.messagePlaceholder'](),
					rows: 6
				}
			]
		}
	];

	const contactDetails = [
		{
			icon: MailIcon,
			label: m['ContactPage.emailUs'](),
			value: COMPANY_DATA.EMAIL,
			href: `mailto:${COMPANY_DATA.EMAIL}`
		},
		{ icon: MapPinIcon, label: m['ContactPage.whereWeAre'](), value: m['ContactPage.whereWeAreValue']() },
		{ icon: ClockIcon, label: m['ContactPage.typicalReply'](), value: m['ContactPage.typicalReplyValue']() }
	];

	const socials = [
		{ icon: InstagramIcon, href: COMPANY_DATA.INSTAGRAM_URL, label: m['ContactPage.instagram']() },
		{ icon: FacebookIcon, href: COMPANY_DATA.FACEBOOK_URL, label: m['ContactPage.facebook']() },
		{ icon: TikTokIcon, href: COMPANY_DATA.TIKTOK_URL, label: m['ContactPage.tiktok']() },
		{ icon: YoutubeIcon, href: COMPANY_DATA.YOUTUBE_URL, label: m['ContactPage.youtube']() }
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
			toast.error(m['ContactPage.sendError']({ email: COMPANY_DATA.EMAIL }));
			return false;
		}
	}
</script>

<SvelteHead
	title={m['ContactPage.SEO.title']({ name: COMPANY_DATA.NAME })}
	description={m['ContactPage.SEO.description']()}
/>

<div class="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
	<!-- Heading -->
	<div class="max-w-2xl">
		<p class="text-xs font-semibold tracking-[0.22em] text-primary uppercase">
			{m['ContactPage.eyebrow']()}
		</p>
		<h1
			class="mt-4 font-display text-4xl font-medium tracking-tight text-balance text-foreground sm:text-5xl"
		>
			{m['ContactPage.heading']()}
		</h1>
		<p class="mt-4 text-lg text-pretty text-muted-foreground">
			{m['ContactPage.intro']()}
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
				<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
					{m['ContactPage.followAlong']()}
				</p>
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
				submitLabel={m['ContactPage.submitLabel']()}
			>
				{#snippet header()}
					<div>
						<h2 class="text-xl font-semibold tracking-tight text-foreground">
							{m['ContactPage.formTitle']()}
						</h2>
						<p class="mt-1.5 text-sm text-muted-foreground">
							{m['ContactPage.formSubtitle']()}
						</p>
					</div>
				{/snippet}
			</MutationForm>
		</div>
	</div>
</div>
