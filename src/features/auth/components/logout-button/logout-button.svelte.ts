// LIBRARIES
import { m } from '@/shared/lib/paraglide/messages';
import { authClient } from '@/features/auth/lib/auth-client';

// CONFIG
import { UNPROTECTED_PAGE_ENDPOINTS } from '@/shared/routeEndpoints.js';

// COMPONENTS
import { toast } from 'svelte-sonner';

// UTILS
import { appGoto } from '@/utils/app-navigation';

export function useLogout() {
	let isLoggingOut = $state(false);

	async function logout() {
		isLoggingOut = true;

		try {
			const result = await authClient.signOut();

			if (result.error) {
				console.error('Sign out error:', result.error);
				toast.error(result.error.message as string);
				return;
			}

			toast.success(m['LogoutButton.logoutSuccess']());
			await appGoto(UNPROTECTED_PAGE_ENDPOINTS.LOGIN);
		} finally {
			isLoggingOut = false;
		}
	}

	return {
		get isLoggingOut() {
			return isLoggingOut;
		},
		logout
	};
}
