// DATA
import { TERMINAL_BOOKING_STATUSES } from '@/shared/features/booking/data/bookingsData';

export function isTerminalBookingStatus(status: string): boolean {
	return TERMINAL_BOOKING_STATUSES.has(status as never);
}
