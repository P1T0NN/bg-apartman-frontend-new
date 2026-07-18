// UTILS
import { internalMutation } from '@/convex/_generated/server';
import { sendBookingAutoDeclinedEmail } from '@/convex/email/sendBookingAutoDeclinedEmail';
import { todayIsoUtc } from '@/shared/features/booking/utils/daysUntilCheckIn';

/** Hard cap per status per run so a backlog can't blow the function budget. */
const MAX_PER_RUN = 1_000;

/**
 * Idempotent booking-lifecycle sweep. Runs on a schedule (see {@link registerBookingCrons}) and
 * advances bookings purely by date/time — there are no manual check-in/check-out actions:
 *
 *   - `confirmed` whose check-in date has arrived  → `checked_in`
 *   - `confirmed`/`checked_in` past their check-out → `checked_out` (self-heals a missed run by
 *     jumping straight from `confirmed` if the whole stay elapsed between passes)
 *   - `pending` past `pendingExpiresAt`             → `auto_declined` (+ guest email)
 *
 * ISO dates (`YYYY-MM-DD`) compare correctly with `<`/`>=` lexicographically. Check-out fires the
 * day *after* the checkout date so a guest still counts as `checked_in` on their departure morning.
 * Safe to run on any cadence; each pass only touches rows that are actually due.
 */
export const advanceBookingLifecycle = internalMutation({
	args: {},
	handler: async (ctx) => {
		const today = todayIsoUtc();
		const now = Date.now();
		let checkedIn = 0;
		let checkedOut = 0;
		let autoDeclined = 0;

		// confirmed → checked_in / checked_out
		const confirmed = await ctx.db
			.query('bookings')
			.withIndex('by_status', (q) => q.eq('status', 'confirmed'))
			.take(MAX_PER_RUN);
		for (const b of confirmed) {
			if (today > b.checkOutDate) {
				await ctx.db.patch(b._id, { status: 'checked_out', updatedAt: now });
				checkedOut++;
			} else if (today >= b.checkInDate) {
				await ctx.db.patch(b._id, { status: 'checked_in', updatedAt: now });
				checkedIn++;
			}
		}

		// checked_in → checked_out
		const checkedInRows = await ctx.db
			.query('bookings')
			.withIndex('by_status', (q) => q.eq('status', 'checked_in'))
			.take(MAX_PER_RUN);
		for (const b of checkedInRows) {
			if (today > b.checkOutDate) {
				await ctx.db.patch(b._id, { status: 'checked_out', updatedAt: now });
				checkedOut++;
			}
		}

		// pending → auto_declined (expired) + notify the guest
		const pending = await ctx.db
			.query('bookings')
			.withIndex('by_status', (q) => q.eq('status', 'pending'))
			.take(MAX_PER_RUN);
		for (const b of pending) {
			if (b.pendingExpiresAt === undefined || b.pendingExpiresAt > now) continue;

			await ctx.db.patch(b._id, {
				status: 'auto_declined',
				updatedAt: now,
				cancelledBy: 'system',
				cancelReason: 'Request expired — the host did not respond in time.',
				pendingExpiresAt: undefined
			});

			const apartment = b.apartmentId ? await ctx.db.get(b.apartmentId) : null;
			const apartmentTitle = apartment?.title ?? b.apartmentSlug;

			await sendBookingAutoDeclinedEmail(ctx, {
				// No per-guest locale is stored on the booking; cron emails default to English.
				locale: 'en',
				bookingCode: b.bookingCode,
				guestFirstName: b.guestFirstName,
				guestEmail: b.guestEmail,
				apartmentTitle,
				checkInDate: b.checkInDate,
				checkOutDate: b.checkOutDate
			});
			autoDeclined++;
		}

		return { checkedIn, checkedOut, autoDeclined };
	}
});
