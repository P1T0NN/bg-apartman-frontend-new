// HELPERS
import { listUserBookingsQuery } from '@/convex/tables/bookings/helpers/listUserBookings';

/**
 * Guest-scoped booking list for the "My bookings" page. Status filter, search and sort are
 * resolved server-side, and the payload carries the tab counts in `extra.counts` — one
 * subscription for the whole table (see `listUserBookingsQuery`).
 *
 * Host-side twin: {@link fetchHostBookingsSafe}.
 */
export const fetchMyBookingsSafe = listUserBookingsQuery('guest');
