// LIBRARIES
import { v } from 'convex/values';

// UTILS
import { adminMutation } from '@/convex/auth/middleware/authMiddleware';
import { AUDIT_ACTIONS } from '@/convex/tables/auditLog/auditLogConfigs';

// SCHEMAS
import { mutationResult, type MutationResult } from '@/convex/schemas/schemas';

/**
 * Admin toggle for the homepage strip (AccommodationsSystemDesign.md §7, §13.8) —
 * replacing "set it in the Convex dashboard".
 *
 * Deliberately narrow, and the narrowness is the design:
 *  - **Never host-facing**, and never purchasable. Selling placement is a monetization
 *    mode, which would enter through §8 with its own design revision — not a checkbox
 *    (§12's rejected list).
 *  - **Not a status change.** Featuring an unpublished listing is a no-op for guests
 *    because search only ever reads `published` (A1/§7), so this write stays purely
 *    editorial and never touches `status` (A3).
 *
 * Audit-logged like every admin action on a listing (A2).
 */
export const setApartmentFeatured = adminMutation('setApartmentFeatured')({
	args: {
		id: v.id('apartments'),
		isFeatured: v.boolean()
	},
	returns: mutationResult,
	handler: async (ctx, args): Promise<MutationResult> => {
		const apartment = await ctx.db.get(args.id);
		if (!apartment) return { success: false, message: { key: 'GenericMessages.FORBIDDEN' } };

		if (apartment.isFeatured === args.isFeatured) {
			return { success: true, message: { key: 'GenericMessages.ACCOMMODATION_UPDATED' } };
		}

		await ctx.db.patch(args.id, { isFeatured: args.isFeatured, updatedAt: Date.now() });

		ctx.audit(AUDIT_ACTIONS.APARTMENT_FEATURE, {
			resource: { table: 'apartments', id: args.id },
			before: { isFeatured: apartment.isFeatured },
			after: { isFeatured: args.isFeatured }
		});

		return {
			success: true,
			message: {
				key: args.isFeatured
					? 'GenericMessages.ACCOMMODATION_FEATURED'
					: 'GenericMessages.ACCOMMODATION_UNFEATURED'
			}
		};
	}
});
