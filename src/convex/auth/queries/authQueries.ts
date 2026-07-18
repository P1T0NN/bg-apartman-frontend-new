// LIBRARIES
import { query } from '../../_generated/server';
import { authComponent } from '../auth';

// HELPERS
import { getAuthUserId } from '../helpers/getAuthUserId';

export const getCurrentUser = query({
	args: {},
	handler: async (ctx) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user) return user;

		// A "host" is anyone who owns at least one accommodation (any status). Drives the
		// header/sidebar switch label: non-hosts get a "Become a host" CTA, hosts get
		// "Switch to hosting". One indexed `.first()` — cheap for a per-page auth query.
		const userId = await getAuthUserId(ctx);
		const isHost = userId
			? (await ctx.db
					.query('apartments')
					.withIndex('by_host', (q) => q.eq('hostId', userId))
					.first()) !== null
			: false;

		return { ...user, isHost };
	}
});
