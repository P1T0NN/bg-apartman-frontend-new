<script lang="ts">
	// LIBRARIES
	import { m } from '@/shared/lib/paraglide/messages';

	let {
		quote,
		name,
		role,
		avatarSrc,
		xUrl = '',
	}: {
		quote: string;
		name: string;
		role: string;
		avatarSrc: string;
		xUrl?: string;
	} = $props();
</script>

<div
	class="flex flex-col justify-between h-[220px] rounded-sm border-[1.2px] border-border shrink-0 grow-0 md:w-[440px] sm:w-[320px] w-[280px]"
>
	<p class="px-5 py-5 tracking-tight text-sm font-extralight md:text-base text-foreground">
		{quote}
	</p>

	<div
		class="flex overflow-hidden h-[30%] md:h-[28%] gap-1 w-full border-t-[1.2px] border-border"
	>
		<div class="flex items-center w-3/4 gap-3 px-4 py-3">
			<img class="w-10 h-10 rounded-full" src={avatarSrc} alt={name} />
			<div class="flex flex-col items-start justify-start flex-1 gap-0">
				<h5 class="text-sm font-medium md:text-base text-foreground">{name}</h5>
				<p class="text-xs md:text-sm text-muted-foreground mt-[-4px]">
					{role}
				</p>
			</div>
		</div>

		<div class="w-px bg-border"></div>

		<div class="flex items-center justify-center max-w-full mx-auto">
			{#if xUrl}
				<a href={xUrl} target="_blank" rel="noopener noreferrer" aria-label="View {name} on X" class="text-xs md:text-sm text-foreground hover:underline">
					{m['TestimonialsSection.UpDownAnimation.view']()}
				</a>
			{:else}
				<span class="text-xs md:text-sm text-muted-foreground" aria-hidden="true">X</span>
			{/if}
		</div>
	</div>
</div>
