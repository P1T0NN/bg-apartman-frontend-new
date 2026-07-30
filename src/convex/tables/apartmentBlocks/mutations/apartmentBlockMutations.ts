// CONFIG
import { ACCOMMODATIONS_CONFIG } from '@/shared/config';

// LIBRARIES
import { v } from 'convex/values';

// UTILS
import { authMutation } from '@/convex/auth/middleware/authMiddleware';
import { BLOCKING_BOOKING_STATUSES } from '@/shared/features/booking/data/bookingsData';
import { nightRangesOverlap } from '@/shared/features/booking/utils/nightRangesOverlap';
import { nightsInRange } from '@/shared/features/booking/utils/nightsInRange';
import { todayInPropertyZone } from '@/shared/features/booking/utils/daysUntilCheckIn';

// SCHEMAS
import { mutationResult, type MutationResult } from '@/convex/schemas/schemas';

// TYPES
import type { Id } from '@/convex/_generated/dataModel';
import type { MutationCtx } from '@/convex/_generated/server';

const blockArgs = {
	apartmentId: v.id('apartments'),
	/** ISO `YYYY-MM-DD`, inclusive first night. */
	startDate: v.string(),
	/** ISO `YYYY-MM-DD`, EXCLUSIVE — the checkout day, not a blocked night. */
	endDate: v.string()
};

/** Ownership gate shared by both mutations: a host only ever touches their own calendar. */
async function requireOwnedApartment(
	ctx: MutationCtx,
	apartmentId: Id<'apartments'>,
	userId: string
) {
	const apartment = await ctx.db.get(apartmentId);
	return apartment && apartment.hostId === userId ? apartment : null;
}

/**
 * Block nights on a listing's calendar — personal use, maintenance, "vacation mode"
 * (HostSystemDesign.md §4). Blocked nights are unavailable to guests exactly like a
 * confirmed stay, but they are NOT bookings: they never appear in any booking list, count,
 * stat or email (BookingSystemDesign.md §6).
 *
 * ponytail: one row per night keeps block/unblock exact with zero range-splitting logic.
 * At a human-scale host's volume that is a handful of rows; if someone starts blocking
 * years at a time, switch to stored ranges plus a split-on-unblock.
 */
export const blockApartmentDates = authMutation('blockApartmentDates')({
	args: blockArgs,
	returns: mutationResult,
	handler: async (ctx, args): Promise<MutationResult> => {
		const apartment = await requireOwnedApartment(ctx, args.apartmentId, ctx.userId);
		if (!apartment) return { success: false, message: { key: 'GenericMessages.FORBIDDEN' } };

		const nights = nightsInRange(args.startDate, args.endDate);
		if (nights.length === 0 || nights.length > ACCOMMODATIONS_CONFIG.MAX_BLOCK_NIGHTS_PER_ACTION) {
			return { success: false, message: { key: 'GenericMessages.INVALID_BOOKING_DATES' } };
		}

		// Past nights can't be sold, so blocking them is meaningless bookkeeping.
		const today = todayInPropertyZone();
		if (args.startDate < today) {
			return { success: false, message: { key: 'GenericMessages.INVALID_BOOKING_DATES' } };
		}

		// Blocking never cancels: a night already sold stays sold, and the host is told to
		// use the booking's own cancel flow instead.
		const bookings = await ctx.db
			.query('bookings')
			.withIndex('by_apartment_dates', (q) =>
				q.eq('apartmentId', args.apartmentId).lt('checkInDate', args.endDate)
			)
			.collect();

		const clashesWithStay = bookings.some(
			(booking) =>
				BLOCKING_BOOKING_STATUSES.has(booking.status) &&
				nightRangesOverlap(args.startDate, args.endDate, booking.checkInDate, booking.checkOutDate)
		);
		if (clashesWithStay) {
			return { success: false, message: { key: 'GenericMessages.DATES_HAVE_CONFIRMED_STAY' } };
		}

		// Re-blocking an already-blocked night is a no-op, not an error — the host asked for
		// the range to end up blocked, and it does.
		const existing = await ctx.db
			.query('apartmentBlocks')
			.withIndex('by_apartment', (q) =>
				q.eq('apartmentId', args.apartmentId).lt('startDate', args.endDate)
			)
			.collect();
		const alreadyBlocked = new Set(existing.map((block) => block.startDate));

		for (const night of nights) {
			if (alreadyBlocked.has(night)) continue;
			await ctx.db.insert('apartmentBlocks', {
				apartmentId: args.apartmentId,
				startDate: night,
				endDate: addOneDay(night)
			});
		}

		return { success: true, message: { key: 'GenericMessages.CALENDAR_UPDATED' } };
	}
});

/** Reopen previously blocked nights. Only ever deletes blocks — never touches bookings. */
export const unblockApartmentDates = authMutation('unblockApartmentDates')({
	args: blockArgs,
	returns: mutationResult,
	handler: async (ctx, args): Promise<MutationResult> => {
		const apartment = await requireOwnedApartment(ctx, args.apartmentId, ctx.userId);
		if (!apartment) return { success: false, message: { key: 'GenericMessages.FORBIDDEN' } };

		if (nightsInRange(args.startDate, args.endDate).length === 0) {
			return { success: false, message: { key: 'GenericMessages.INVALID_BOOKING_DATES' } };
		}

		const blocks = await ctx.db
			.query('apartmentBlocks')
			.withIndex('by_apartment', (q) =>
				q.eq('apartmentId', args.apartmentId).lt('startDate', args.endDate)
			)
			.collect();

		for (const block of blocks) {
			if (nightRangesOverlap(args.startDate, args.endDate, block.startDate, block.endDate)) {
				await ctx.db.delete(block._id);
			}
		}

		return { success: true, message: { key: 'GenericMessages.CALENDAR_UPDATED' } };
	}
});

/** Next calendar day for a single-night block's exclusive end. */
function addOneDay(isoDate: string): string {
	return new Date(Date.parse(`${isoDate}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10);
}
