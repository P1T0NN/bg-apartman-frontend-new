// HELPERS
import { listUserBookingsQuery } from '@/convex/tables/bookings/helpers/listUserBookings';

/**
 * Host-scoped booking list for the "Reservations" page. Status filter, search and sort are
 * resolved server-side, and the payload carries the tab counts in `extra.counts` — one
 * subscription for the whole table (see `listUserBookingsQuery`).
 *
 * Guest-side twin: {@link fetchMyBookingsSafe}.
 */
export const fetchHostBookingsSafe = listUserBookingsQuery('host');
