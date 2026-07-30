<script lang="ts">
	// CLASSES
	import { authClass } from '@/features/auth/classes/authClass.svelte';

	let { subtitle }: { subtitle: string } = $props();

	const user = $derived(authClass.currentUser);
	const firstName = $derived(user?.name?.split(' ')[0]);
</script>

<header class="flex flex-col gap-1 border-b pb-5">
	<h1 class="text-2xl font-semibold tracking-tight md:text-3xl">
		Welcome back{firstName ? `, ${firstName}` : ''}
	</h1>

	<p class="max-w-2xl text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
</header>
