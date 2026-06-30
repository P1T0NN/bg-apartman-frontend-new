// HELPERS
import { resolveApartmentSummary } from '@/convex/tables/bookings/helpers/resolveApartmentSummary';

// TYPES
import type { Doc } from '@/convex/_generated/dataModel';
import type { QueryCtx } from '@/convex/_generated/server';
import type { typesBookingSafe } from '@/shared/features/booking/types/bookingTypes';

/**
 * Enrich a booking row into the client-facing `typesBookingSafe`: attach the denormalized
 * apartment summary and drop the server-only columns the client type omits — `apartmentSlug`
 * (the join key `resolveApartmentSummary` reads) and `archivedAt` (soft-delete marker).
 */
export async function bookingToBookingSafe(
	ctx: QueryCtx,
	booking: Doc<'bookings'>
): Promise<typesBookingSafe> {
	const { apartmentSlug, archivedAt, ...rest } = booking;
    
	const apartment = await resolveApartmentSummary(ctx, booking);

	return { ...rest, apartment };
}
