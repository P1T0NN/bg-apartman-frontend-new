<script lang="ts">
	// CLASSES
	import { authClass } from '@/features/auth/classes/authClass.svelte';

	let { subtitle }: { subtitle: string } = $props();

	const user = $derived(authClass.currentUser);
	const firstName = $derived(user?.name?.split(' ')[0]);
</script>

<header>
	<h1 class="text-2xl font-semibold tracking-tight">
		Welcome back {firstName ? `, ${firstName}` : ''}
	</h1>

	<p class="mt-1 text-sm text-muted-foreground">{subtitle}</p>
</header>
