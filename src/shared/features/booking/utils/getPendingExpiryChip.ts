// TYPES
import type { typesPendingExpiryChip, typesPendingExpiryTone } from '@/shared/features/booking/types/bookingTypes';

/** Urgency chip for a pending booking's host response deadline. */
export function getPendingExpiryChip(
	expiresAt: number | undefined,
	now = Date.now()
): typesPendingExpiryChip | null {
	if (expiresAt === undefined) return null;

	const ms = expiresAt - now;
	if (ms <= 0) {
		return { isExpired: true, tone: 'red' };
	}

	const hours = Math.floor(ms / 3_600_000);
	const timeRemaining = hours >= 1 ? `${hours}h` : `${Math.max(1, Math.floor(ms / 60_000))}m`;
	const tone: typesPendingExpiryTone =
		ms < 6 * 3_600_000 ? 'red' : ms < 24 * 3_600_000 ? 'amber' : 'neutral';

	return { isExpired: false, tone, timeRemaining };
}
