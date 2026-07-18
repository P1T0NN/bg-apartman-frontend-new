// TYPES
import type { Doc } from '@/convex/_generated/dataModel';
import type { typesEditAccommodationForm } from '@/shared/features/accommodation/types/accommodationTypes';

/** Optional stored number → input string (`''` when unset). */
const optNumStr = (value: number | undefined): string => (value === undefined ? '' : String(value));

/**
 * Map a stored apartment document to the edit form's value shape. Numbers become
 * strings (what `<input>` binds to and what the mutation re-coerces); existing
 * photos seed `keepImageKeys` in display order. `photos` starts empty — it only
 * collects newly uploaded files.
 */
export function accommodationDocToFormValues(doc: Doc<'apartments'>): typesEditAccommodationForm {
	return {
		id: doc._id,

		title: doc.title,
		type: doc.type,
		description: doc.description,

		placeId: doc.placeId ?? '',
		address: doc.address ?? '',
		addressNumber: doc.addressNumber ?? '',
		city: doc.city ?? '',
		country: doc.country ?? '',
		coordinates: doc.coordinates,
		timeZone: doc.timeZone ?? '',

		bedrooms: String(doc.bedrooms),
		bathrooms: String(doc.bathrooms),
		maxGuests: String(doc.maxGuests),
		squareMeters: String(doc.squareMeters),

		pricePerNight: String(doc.pricePerNight),
		cleaningFee: optNumStr(doc.cleaningFee),
		weekendPremium: optNumStr(doc.weekendPremium),
		discountAmount: optNumStr(doc.discountAmount),
		weeklyDiscount: optNumStr(doc.weeklyDiscount),
		monthlyDiscount: optNumStr(doc.monthlyDiscount),

		minReservationDays: String(doc.minReservationDays),
		maxReservationDays: optNumStr(doc.maxReservationDays),
		checkInTime: doc.checkInTime,
		checkOutTime: doc.checkOutTime,
		quietHoursStart: doc.quietHoursStart ?? '',
		quietHoursEnd: doc.quietHoursEnd ?? '',

		instantBooking: doc.instantBooking,
		paymentMethod: doc.paymentMethod ?? 'cash',
		sameDayReservation: doc.sameDayReservation,
		singleDayReservation: doc.singleDayReservation,
		petsAllowed: doc.petsAllowed,
		smokingAllowed: doc.smokingAllowed,
		partiesAllowed: doc.partiesAllowed,

		amenities: doc.amenities,
		houseRules: doc.houseRules ?? '',

		keepImageKeys: [...doc.images].sort((a, b) => a.order - b.order).map((image) => image.key),
		photos: []
	};
}
