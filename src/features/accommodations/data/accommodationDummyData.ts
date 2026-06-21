// Dummy data for the public single-accommodation page.
//
// Shapes follow the `apartments` table in src/convex/schema.ts, with two display
// extras the real detail query is expected to provide: a resolved `host` profile
// (the `hostId` joined to the better-auth user) and `bookedRanges` (derived from
// the bookings table) so the date picker can grey out unavailable nights.

export type AccommodationImage = {
	key: string;
	url: string;
	alt?: string;
	order: number;
};

export type AccommodationHost = {
	id: string;
	name: string;
	avatarUrl?: string;
	joinedAt: number; // timestamp
	isSuperhost: boolean;
	responseRate: number; // percent
	responseTime: string; // e.g. "within an hour"
	bio: string;
};

/** ISO date range (check-in inclusive, check-out exclusive) already reserved. */
export type BookedRange = { start: string; end: string };

export type AccommodationDetail = {
	_id: string;
	slug: string;

	title: string;
	description: string;
	type: string;

	address: string;
	city: string;
	country?: string;
	coordinates?: { lat: number; lng: number };

	bedrooms: number;
	bathrooms: number;
	maxGuests: number;
	squareMeters: number;

	pricePerNight: number;
	discountAmount?: number; // discounted nightly price; when > 0 the original is struck through
	cleaningFee?: number;
	weekendPremium?: number;
	weeklyDiscount?: number;
	monthlyDiscount?: number;
	currency: 'EUR';

	instantBooking: boolean;
	sameDayReservation: boolean;
	singleDayReservation: boolean;
	petsAllowed: boolean;
	smokingAllowed: boolean;
	partiesAllowed: boolean;
	minReservationDays: number;
	maxReservationDays?: number;
	checkInTime: string; // "15:00"
	checkOutTime: string; // "11:00"
	quietHoursStart?: string;
	quietHoursEnd?: string;

	amenities: string[];
	images: AccommodationImage[];
	coverImageIndex?: number;
	houseRules?: string;

	host: AccommodationHost;
	bookedRanges: BookedRange[];
};

const img = (n: number, url: string, alt: string): AccommodationImage => ({
	key: `skadarlija_${n}`,
	url: `${url}?auto=format&fit=crop&w=1280&q=80`,
	alt,
	order: n
});

export const accommodationDummyData: AccommodationDetail = {
	_id: 'apt_skadarlija_loft',
	slug: 'skadarlija-old-town-loft',

	title: 'Skadarlija Old Town Loft',
	description:
		'A bright, recently renovated loft tucked into the cobbled bohemian quarter of Skadarlija — steps from the city’s best kafanas, live music and Republic Square. Tall arched windows fill the open-plan living space with morning light, and the quiet bedroom looks out over a leafy inner courtyard. Whether you’re here to explore Belgrade or simply slow down with a coffee on the balcony, the space was designed to feel like an easy, calm home base in the middle of it all.',
	type: 'loft',

	address: 'Skadarska 29',
	city: 'Belgrade',
	country: 'Serbia',
	coordinates: { lat: 44.8198, lng: 20.4685 },

	bedrooms: 1,
	bathrooms: 1,
	maxGuests: 4,
	squareMeters: 62,

	pricePerNight: 95,
	discountAmount: 85,
	cleaningFee: 25,
	weekendPremium: 110,
	weeklyDiscount: 10,
	monthlyDiscount: 22,
	currency: 'EUR',

	instantBooking: true,
	sameDayReservation: false,
	singleDayReservation: false,
	petsAllowed: true,
	smokingAllowed: false,
	partiesAllowed: false,
	minReservationDays: 2,
	maxReservationDays: 30,
	checkInTime: '15:00',
	checkOutTime: '11:00',
	quietHoursStart: '23:00',
	quietHoursEnd: '08:00',

	amenities: [
		'wifi',
		'air_conditioning',
		'heating',
		'kitchen',
		'washer',
		'free_parking',
		'tv',
		'workspace',
		'elevator',
		'balcony',
		'coffee_maker',
		'self_checkin',
		'smoke_alarm'
	],

	images: [
		img(0, 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688', 'Sunlit open-plan living room'),
		img(1, 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85', 'Bedroom with courtyard view'),
		img(2, 'https://images.unsplash.com/photo-1484154218962-a197022b5858', 'Fully equipped kitchen'),
		img(3, 'https://images.unsplash.com/photo-1560185007-cde436f6a4d0', 'Modern bathroom'),
		img(4, 'https://images.unsplash.com/photo-1493809842364-78817add7ffb', 'Dining nook by the window'),
		img(5, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267', 'Cozy reading corner'),
		img(6, 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2', 'Balcony overlooking the courtyard')
	],
	coverImageIndex: 0,

	houseRules:
		'Please treat the space like your own home. No parties or events, and keep noise down during quiet hours so the neighbours can rest. Pets are welcome with prior notice.',

	host: {
		id: 'host_jelena',
		name: 'Jelena',
		avatarUrl:
			'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
		joinedAt: new Date('2021-04-01').getTime(),
		isSuperhost: true,
		responseRate: 99,
		responseTime: 'within an hour',
		bio: 'Born and raised in Belgrade, I love helping guests discover the city beyond the guidebooks. I live nearby and am always a message away if you need anything during your stay.'
	},

	// Reference date: 2026-06-19. A few upcoming stays are already on the books.
	bookedRanges: [
		{ start: '2026-06-25', end: '2026-06-28' },
		{ start: '2026-06-29', end: '2026-07-01' },
		{ start: '2026-07-10', end: '2026-07-15' }
	]
};

/**
 * Resolve a listing from its URL slug. The fixture set holds a single record, so
 * this returns it for any slug. Swap the body for `fetchAccommodationBySlug`
 * against Convex — and return `null` there so the page can show a not-found state.
 */
export function getAccommodationBySlug(_slug: string): AccommodationDetail {
	return accommodationDummyData;
}
