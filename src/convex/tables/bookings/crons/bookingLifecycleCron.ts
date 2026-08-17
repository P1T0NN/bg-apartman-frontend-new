// UTILS
import { OPERATIONAL_LIMITS } from '@/shared/config';
import { internalMutation } from '@/convex/functions';
import { authComponent } from '@/convex/auth/auth';
import { sendBookingAutoDeclinedEmail } from '@/convex/email/sendBookingAutoDeclinedEmail';
import { sendBookingMissedEmail } from '@/convex/email/sendBookingMissedEmail';
import { applyAutoDecline } from '@/shared/features/booking/utils/applyAutoDecline';
import { todayInPropertyZone } from '@/shared/features/booking/utils/daysUntilCheckIn';

/**
 * Idempotent booking-lifecycle sweep. Runs on a schedule (see {@link registerBookingCrons}) and
 * advances bookings purely by date/time — there are no manual check-in/check-out actions:
 *
 *   - `confirmed` whose check-in date has arrived  → `checked_in`
 *   - `confirmed`/`checked_in` past their check-out → `checked_out` (self-heals a missed run by
 *     jumping straight from `confirmed` if the whole stay elapsed between passes)
 *   - `pending` past `pendingExpiresAt`             → `auto_declined` (+ guest email, + hold released)
 *   - `pending` + `awaiting` past `paymentDeadlineAt` → hard-deleted (abandoned checkout)
 *
 * ISO dates (`YYYY-MM-DD`) compare correctly with `<`/`>=` lexicographically. Check-out fires the
 * day *after* the checkout date so a guest still counts as `checked_in` on their departure morning.
 * Safe to run on any cadence; each pass only touches rows that are actually due.
 *
 * "Today" is the PROPERTY's day, not UTC (BookingSystemDesign.md §3): a 23:00 UTC run is
 * already tomorrow in Belgrade, so a UTC clock would flip stays a day early for two hours
 * of every night.
 */
export const advanceBookingLifecycle = internalMutation({
	args: {},
	handler: async (ctx) => {
		const today = todayInPropertyZone();
		const now = Date.now();
		let checkedIn = 0;
		let checkedOut = 0;
		let autoDeclined = 0;
		let reaped = 0;

		// confirmed → checked_in / checked_out
		//
		// Bounded to rows whose check-in has actually arrived. Without the date bound this
		// hourly sweep re-read the platform's entire forward book 24× a day to act on a
		// handful of rows — and worse, `.take()` over a creation-ordered bucket meant that
		// once live bookings passed the cap, the ones past it would never advance at all.
		// Reading in check-in order makes the cap drain-order-correct: oldest due first.
		const confirmed = await ctx.db
			.query('bookings')
			.withIndex('by_status_checkin', (q) => q.eq('status', 'confirmed').lte('checkInDate', today))
			.take(OPERATIONAL_LIMITS.BOOKING_LIFECYCLE_MAX_PER_RUN);
		for (const b of confirmed) {
			if (today > b.checkOutDate) {
				await ctx.db.patch(b._id, { status: 'checked_out', updatedAt: now });
				checkedOut++;
			} else if (today >= b.checkInDate) {
				await ctx.db.patch(b._id, { status: 'checked_in', updatedAt: now });
				checkedIn++;
			}
		}

		// checked_in → checked_out. A guest cannot be in-house before their own check-in
		// date, so the same bound costs nothing and keeps the read date-ordered.
		const checkedInRows = await ctx.db
			.query('bookings')
			.withIndex('by_status_checkin', (q) => q.eq('status', 'checked_in').lte('checkInDate', today))
			.take(OPERATIONAL_LIMITS.BOOKING_LIFECYCLE_MAX_PER_RUN);
		for (const b of checkedInRows) {
			if (today > b.checkOutDate) {
				await ctx.db.patch(b._id, { status: 'checked_out', updatedAt: now });
				checkedOut++;
			}
		}

		// pending → auto_declined (expired) + notify the guest, and abandoned checkouts reaped
		const pending = await ctx.db
			.query('bookings')
			.withIndex('by_status', (q) => q.eq('status', 'pending'))
			.take(OPERATIONAL_LIMITS.BOOKING_LIFECYCLE_MAX_PER_RUN);
		for (const b of pending) {
			// Abandoned checkout: hard-DELETE past the deadline (PaymentsSystemDesign.md §3).
			// Not a status-machine violation — an `awaiting` booking never entered the
			// machine: no email was sent, no human ever saw the row, nothing references it,
			// and the provider hold expires with its own session. (A *completed* checkout
			// that lost the race is different — that guest gets a real `auto_declined` row.)
			if (b.paymentStatus === 'awaiting') {
				if (b.paymentDeadlineAt !== undefined && b.paymentDeadlineAt <= now) {
					await ctx.db.delete(b._id);
					reaped++;
				}
				continue;
			}

			if (b.pendingExpiresAt === undefined || b.pendingExpiresAt > now) continue;

			// Same transition shape as the lost-overlap-race path in `confirmBooking` —
			// one util owns what an auto-decline writes, so the two can't drift.
			const patch = applyAutoDecline(b, 'expired', now);
			if (!patch) continue;

			await ctx.db.patch(b._id, { ...patch });

			const apartment = await ctx.db.get(b.apartmentId);
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

			// The host's "you missed one" nudge (BookingSystemDesign.md §8) — once per event,
			// sent here and nowhere else, so it can never become a drip.
			const host = await authComponent.getAnyUserById(ctx, b.hostId);
			const hostEmail = host?.email?.trim();
			if (hostEmail) {
				await sendBookingMissedEmail(ctx, {
					locale: 'en',
					bookingId: b._id,
					bookingCode: b.bookingCode,
					guestName: `${b.guestFirstName} ${b.guestLastName}`,
					hostName: host?.name?.trim() || 'Host',
					hostEmail,
					apartmentTitle,
					checkInDate: b.checkInDate,
					checkOutDate: b.checkOutDate
				});
			}
			autoDeclined++;
		}

		return { checkedIn, checkedOut, autoDeclined, reaped };
	}
});
