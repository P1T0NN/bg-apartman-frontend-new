<script lang="ts" module>
	import { getContext, setContext } from 'svelte';

	export type AvatarLoadingStatus = 'loading' | 'loaded' | 'error';

	type AvatarContext = { status: AvatarLoadingStatus };

	const AVATAR_KEY = Symbol('avatar');

	export function setAvatarContext(ctx: AvatarContext): void {
		setContext(AVATAR_KEY, ctx);
	}

	export function getAvatarContext(): AvatarContext {
		return getContext(AVATAR_KEY);
	}
</script>

<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn, type WithElementRef } from '@/utils/utils.js';

	let {
		ref = $bindable(null),
		loadingStatus = $bindable<AvatarLoadingStatus>('loading'),
		size = 'default',
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLSpanElement>> & {
		loadingStatus?: AvatarLoadingStatus;
		size?: 'default' | 'sm' | 'lg';
	} = $props();

	// Shared status: Image writes it (native load/error), Fallback reads it. Bridged to the
	// bindable `loadingStatus` prop so it stays reactive and API-compatible with the old bits-ui root.
	setAvatarContext({
		get status() {
			return loadingStatus;
		},
		set status(value) {
			loadingStatus = value;
		}
	});
</script>

<span
	bind:this={ref}
	data-slot="avatar"
	data-size={size}
	class={cn(
		'group/avatar relative flex size-8 shrink-0 rounded-full select-none after:absolute after:inset-0 after:rounded-full after:border after:border-border after:mix-blend-darken data-[size=lg]:size-10 data-[size=sm]:size-6 dark:after:mix-blend-lighten',
		className
	)}
	{...restProps}
>
	{@render children?.()}
</span>
