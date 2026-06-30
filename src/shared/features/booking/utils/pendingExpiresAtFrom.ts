// CONFIG
import { HOST_RESPONSE_MS } from '@/shared/features/booking/config';

export function pendingExpiresAtFrom(createdAtMs: number): number {
	return createdAtMs + HOST_RESPONSE_MS;
}
