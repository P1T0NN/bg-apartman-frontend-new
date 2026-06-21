<script lang="ts">
	// LIBRARIES
	import { toast } from 'svelte-sonner';

	// COMPONENTS
	import { Button } from '@/shared/components/ui/button/index.js';

	// LUCIDE ICONS
	import AwardIcon from '@lucide/svelte/icons/award';
	import BadgeCheckIcon from '@lucide/svelte/icons/badge-check';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import MailIcon from '@lucide/svelte/icons/mail';

	// TYPES
	import type { AccommodationHost } from '@/features/accommodations/data/accommodationDummyData';

	let { host }: { host: AccommodationHost } = $props();

	const joinedYear = $derived(new Date(host.joinedAt).getFullYear());
</script>

<section class="space-y-4">
	<h2 class="text-lg font-semibold tracking-tight">Meet your host</h2>

	<div class="rounded-2xl border p-5 sm:p-6">
		<div class="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
			<div class="flex items-center gap-4">
				{#if host.avatarUrl}
					<img
						src={host.avatarUrl}
						alt={host.name}
						class="size-16 rounded-full object-cover ring-1 ring-border"
						loading="lazy"
					/>
				{/if}
				<div>
					<p class="text-lg font-semibold">{host.name}</p>
					{#if host.isSuperhost}
						<p class="flex items-center gap-1.5 text-sm text-muted-foreground">
							<AwardIcon class="size-4" aria-hidden="true" />
							Superhost
						</p>
					{/if}
				</div>
			</div>

			<div class="grid grid-cols-3 gap-4 sm:ml-auto sm:gap-6">
				<div>
					<p class="text-xl font-semibold tabular-nums">{host.responseRate}%</p>
					<p class="text-xs text-muted-foreground">Response rate</p>
				</div>
				<div>
					<p class="text-sm font-semibold">{joinedYear}</p>
					<p class="text-xs text-muted-foreground">Hosting since</p>
				</div>
				<div>
					<p class="flex items-center gap-1 text-sm font-semibold">
						<ClockIcon class="size-3.5" aria-hidden="true" />
						Fast
					</p>
					<p class="text-xs text-muted-foreground">Replies {host.responseTime}</p>
				</div>
			</div>
		</div>

		<p class="mt-5 text-sm leading-relaxed text-foreground/90">{host.bio}</p>

		<div class="mt-5 flex flex-wrap items-center gap-3">
			<Button variant="outline" onclick={() => toast.success('Message sent to ' + host.name)}>
				<MailIcon class="size-4" aria-hidden="true" />
				Contact host
			</Button>
			<p class="flex items-center gap-1.5 text-xs text-muted-foreground">
				<BadgeCheckIcon class="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
				Identity verified
			</p>
		</div>
	</div>
</section>
