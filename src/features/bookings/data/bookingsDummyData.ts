// Dummy bookings data for the host-facing Bookings page.
//
// Shapes mirror the `bookings` table in src/convex/schema.ts, with one addition:
// each record carries a denormalized `apartment` summary so the UI can show the
// listing title / photo / city without a second lookup. The real query is expected
// to enrich bookings the same way before returning them to the client.

/** Mirrors the `status` union on the bookings table. */
export type BookingStatus =
	| 'pending'
	| 'confirmed'
	| 'checked_in'
	| 'checked_out'
	| 'cancelled';

/** Mirrors the `paymentStatus` union on the bookings table. */
export type PaymentStatus = 'pending' | 'paid' | 'refunded';

/** Mirrors the `paymentMethod` union on the bookings table. */
export type PaymentMethod = 'cash';

/** Denormalized listing summary attached to each booking for display. */
export type BookingApartmentSummary = {
	_id: string;
	title: string;
	city: string;
	type: string;
	imageUrl: string;
};

/** A single booking row, mirroring the schema plus the enriched `apartment`. */
export type BookingRecord = {
	_id: string;
	_creationTime: number;

	bookingCode: string;

	apartmentId: string;
	apartment: BookingApartmentSummary;
	hostId: string;
	guestId?: string;

	guestFirstName: string;
	guestLastName: string;
	guestEmail: string;
	guestPhone: string;
	specialRequests?: string;

	checkInDate: string; // ISO date "2026-06-25"
	checkOutDate: string; // ISO date "2026-06-28"
	numberOfAdults: number;
	numberOfChildren: number;
	numberOfNights: number;

	subtotal: number;
	cleaningFee: number;
	total: number;
	currency: 'EUR';

	paymentMethod: PaymentMethod;
	paymentStatus: PaymentStatus;
	status: BookingStatus;

	updatedAt: number;
	cancelledAt?: number;
	cancelledBy?: 'guest' | 'host';
	cancelReason?: string;
	archivedAt?: number;
};

/** Epoch-ms helper so the data below stays readable as ISO strings. */
const at = (iso: string): number => new Date(iso).getTime();

const HOST_ID = 'host_demo_1';

// --- Listings the bookings belong to -----------------------------------------

const APARTMENTS = {
	skadarlija: {
		_id: 'apt_skadarlija_loft',
		title: 'Skadarlija Old Town Loft',
		city: 'Belgrade',
		type: 'loft',
		imageUrl:
			'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=240&q=80'
	},
	vracar: {
		_id: 'apt_vracar_studio',
		title: 'Vračar Garden Studio',
		city: 'Belgrade',
		type: 'studio',
		imageUrl:
			'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=240&q=80'
	},
	riverside: {
		_id: 'apt_riverside_penthouse',
		title: 'Riverside Penthouse',
		city: 'Novi Sad',
		type: 'penthouse',
		imageUrl:
			'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=240&q=80'
	},
	knez: {
		_id: 'apt_knez_apartment',
		title: 'Knez Mihailova Apartment',
		city: 'Belgrade',
		type: 'apartment',
		imageUrl:
			'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=240&q=80'
	},
	zlatibor: {
		_id: 'apt_zlatibor_villa',
		title: 'Zlatibor Mountain Villa',
		city: 'Zlatibor',
		type: 'villa',
		imageUrl:
			'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=240&q=80'
	}
} as const;

// Reference date for this fixture set: 2026-06-19.
export const bookingsDummyData: BookingRecord[] = [
	// === PENDING — awaiting the host's response ===============================
	{
		_id: 'bk_01',
		_creationTime: at('2026-06-18T20:14:00Z'),
		bookingCode: 'BK7X9M2P4Q',
		apartmentId: APARTMENTS.skadarlija._id,
		apartment: APARTMENTS.skadarlija,
		hostId: HOST_ID,
		guestId: 'guest_marko',
		guestFirstName: 'Marko',
		guestLastName: 'Jovanović',
		guestEmail: 'marko.jovanovic@gmail.com',
		guestPhone: '+381 64 123 4567',
		specialRequests: 'Arriving late, around 23:00 — is self check-in possible?',
		checkInDate: '2026-06-25',
		checkOutDate: '2026-06-28',
		numberOfAdults: 2,
		numberOfChildren: 0,
		numberOfNights: 3,
		subtotal: 255,
		cleaningFee: 25,
		total: 280,
		currency: 'EUR',
		paymentMethod: 'cash',
		paymentStatus: 'pending',
		status: 'pending',
		updatedAt: at('2026-06-18T20:14:00Z')
	},
	{
		_id: 'bk_02',
		_creationTime: at('2026-06-17T09:42:00Z'),
		bookingCode: 'BK3F8K1L9Z',
		apartmentId: APARTMENTS.vracar._id,
		apartment: APARTMENTS.vracar,
		hostId: HOST_ID,
		guestFirstName: 'Ana',
		guestLastName: 'Petrović',
		guestEmail: 'ana.petrovic@outlook.com',
		guestPhone: '+381 63 998 2210',
		specialRequests: 'Travelling with a 4-year-old — is a baby cot available?',
		checkInDate: '2026-07-02',
		checkOutDate: '2026-07-09',
		numberOfAdults: 2,
		numberOfChildren: 1,
		numberOfNights: 7,
		subtotal: 385,
		cleaningFee: 15,
		total: 400,
		currency: 'EUR',
		paymentMethod: 'cash',
		paymentStatus: 'pending',
		status: 'pending',
		updatedAt: at('2026-06-17T09:42:00Z')
	},
	{
		_id: 'bk_03',
		_creationTime: at('2026-06-19T07:05:00Z'),
		bookingCode: 'BK9Q2W5E1R',
		apartmentId: APARTMENTS.riverside._id,
		apartment: APARTMENTS.riverside,
		hostId: HOST_ID,
		guestId: 'guest_stefan',
		guestFirstName: 'Stefan',
		guestLastName: 'Nikolić',
		guestEmail: 'stefan.nikolic@gmail.com',
		guestPhone: '+381 60 447 1180',
		specialRequests: 'Celebrating an anniversary — early check-in would be amazing.',
		checkInDate: '2026-06-22',
		checkOutDate: '2026-06-24',
		numberOfAdults: 4,
		numberOfChildren: 0,
		numberOfNights: 2,
		subtotal: 280,
		cleaningFee: 40,
		total: 320,
		currency: 'EUR',
		paymentMethod: 'cash',
		paymentStatus: 'pending',
		status: 'pending',
		updatedAt: at('2026-06-19T07:05:00Z')
	},
	{
		_id: 'bk_04',
		_creationTime: at('2026-06-16T15:30:00Z'),
		bookingCode: 'BKU5I4O3P2',
		apartmentId: APARTMENTS.knez._id,
		apartment: APARTMENTS.knez,
		hostId: HOST_ID,
		guestFirstName: 'Nataša',
		guestLastName: 'Cvetković',
		guestEmail: 'natasa.cvetkovic@gmail.com',
		guestPhone: '+381 65 220 7733',
		checkInDate: '2026-07-15',
		checkOutDate: '2026-07-20',
		numberOfAdults: 2,
		numberOfChildren: 0,
		numberOfNights: 5,
		subtotal: 475,
		cleaningFee: 30,
		total: 505,
		currency: 'EUR',
		paymentMethod: 'cash',
		paymentStatus: 'pending',
		status: 'pending',
		updatedAt: at('2026-06-16T15:30:00Z')
	},

	// === CONFIRMED — upcoming stays ==========================================
	{
		_id: 'bk_05',
		_creationTime: at('2026-06-10T11:20:00Z'),
		bookingCode: 'BK5T6Y7U8I',
		apartmentId: APARTMENTS.knez._id,
		apartment: APARTMENTS.knez,
		hostId: HOST_ID,
		guestId: 'guest_jelena',
		guestFirstName: 'Jelena',
		guestLastName: 'Đorđević',
		guestEmail: 'jelena.djordjevic@gmail.com',
		guestPhone: '+381 64 771 0098',
		specialRequests: 'Please provide an extra set of towels.',
		checkInDate: '2026-06-21',
		checkOutDate: '2026-06-26',
		numberOfAdults: 2,
		numberOfChildren: 0,
		numberOfNights: 5,
		subtotal: 475,
		cleaningFee: 30,
		total: 505,
		currency: 'EUR',
		paymentMethod: 'cash',
		paymentStatus: 'paid',
		status: 'confirmed',
		updatedAt: at('2026-06-11T08:00:00Z')
	},
	{
		_id: 'bk_06',
		_creationTime: at('2026-05-30T18:45:00Z'),
		bookingCode: 'BK2A3S4D5F',
		apartmentId: APARTMENTS.zlatibor._id,
		apartment: APARTMENTS.zlatibor,
		hostId: HOST_ID,
		guestId: 'guest_luka',
		guestFirstName: 'Luka',
		guestLastName: 'Milošević',
		guestEmail: 'luka.milosevic@yahoo.com',
		guestPhone: '+381 62 334 5567',
		specialRequests: 'Large family group — could we get a late checkout on the last day?',
		checkInDate: '2026-07-10',
		checkOutDate: '2026-07-17',
		numberOfAdults: 6,
		numberOfChildren: 2,
		numberOfNights: 7,
		subtotal: 1540,
		cleaningFee: 60,
		total: 1600,
		currency: 'EUR',
		paymentMethod: 'cash',
		paymentStatus: 'paid',
		status: 'confirmed',
		updatedAt: at('2026-05-31T09:10:00Z')
	},
	{
		_id: 'bk_07',
		_creationTime: at('2026-06-15T13:05:00Z'),
		bookingCode: 'BK8G9H1J2K',
		apartmentId: APARTMENTS.skadarlija._id,
		apartment: APARTMENTS.skadarlija,
		hostId: HOST_ID,
		guestFirstName: 'Milica',
		guestLastName: 'Pavlović',
		guestEmail: 'milica.pavlovic@gmail.com',
		guestPhone: '+381 66 112 8890',
		checkInDate: '2026-06-29',
		checkOutDate: '2026-07-01',
		numberOfAdults: 1,
		numberOfChildren: 0,
		numberOfNights: 2,
		subtotal: 170,
		cleaningFee: 25,
		total: 195,
		currency: 'EUR',
		paymentMethod: 'cash',
		paymentStatus: 'pending',
		status: 'confirmed',
		updatedAt: at('2026-06-15T17:40:00Z')
	},
	{
		_id: 'bk_08',
		_creationTime: at('2026-06-12T10:00:00Z'),
		bookingCode: 'BK4Z5X6C7V',
		apartmentId: APARTMENTS.vracar._id,
		apartment: APARTMENTS.vracar,
		hostId: HOST_ID,
		guestId: 'guest_nikola',
		guestFirstName: 'Nikola',
		guestLastName: 'Stojanović',
		guestEmail: 'nikola.stojanovic@gmail.com',
		guestPhone: '+381 64 556 2031',
		checkInDate: '2026-06-20',
		checkOutDate: '2026-06-23',
		numberOfAdults: 2,
		numberOfChildren: 0,
		numberOfNights: 3,
		subtotal: 165,
		cleaningFee: 15,
		total: 180,
		currency: 'EUR',
		paymentMethod: 'cash',
		paymentStatus: 'paid',
		status: 'confirmed',
		updatedAt: at('2026-06-12T12:25:00Z')
	},

	// === CHECKED IN — guests currently staying ===============================
	{
		_id: 'bk_09',
		_creationTime: at('2026-06-02T16:18:00Z'),
		bookingCode: 'BK1B2N3M4Q',
		apartmentId: APARTMENTS.riverside._id,
		apartment: APARTMENTS.riverside,
		hostId: HOST_ID,
		guestId: 'guest_ivana',
		guestFirstName: 'Ivana',
		guestLastName: 'Ilić',
		guestEmail: 'ivana.ilic@gmail.com',
		guestPhone: '+381 63 008 4412',
		specialRequests: 'Travelling with a small dog (pet-friendly booking).',
		checkInDate: '2026-06-17',
		checkOutDate: '2026-06-21',
		numberOfAdults: 3,
		numberOfChildren: 0,
		numberOfNights: 4,
		subtotal: 560,
		cleaningFee: 40,
		total: 600,
		currency: 'EUR',
		paymentMethod: 'cash',
		paymentStatus: 'paid',
		status: 'checked_in',
		updatedAt: at('2026-06-17T14:05:00Z')
	},
	{
		_id: 'bk_10',
		_creationTime: at('2026-06-09T09:33:00Z'),
		bookingCode: 'BK6W7E8R9T',
		apartmentId: APARTMENTS.knez._id,
		apartment: APARTMENTS.knez,
		hostId: HOST_ID,
		guestFirstName: 'Đorđe',
		guestLastName: 'Ristić',
		guestEmail: 'djordje.ristic@gmail.com',
		guestPhone: '+381 60 991 7745',
		checkInDate: '2026-06-18',
		checkOutDate: '2026-06-20',
		numberOfAdults: 2,
		numberOfChildren: 0,
		numberOfNights: 2,
		subtotal: 190,
		cleaningFee: 30,
		total: 220,
		currency: 'EUR',
		paymentMethod: 'cash',
		paymentStatus: 'paid',
		status: 'checked_in',
		updatedAt: at('2026-06-18T13:50:00Z')
	},

	// === CHECKED OUT — completed stays =======================================
	{
		_id: 'bk_11',
		_creationTime: at('2026-05-20T12:00:00Z'),
		bookingCode: 'BK0P9O8I7U',
		apartmentId: APARTMENTS.skadarlija._id,
		apartment: APARTMENTS.skadarlija,
		hostId: HOST_ID,
		guestId: 'guest_sara',
		guestFirstName: 'Sara',
		guestLastName: 'Kovačević',
		guestEmail: 'sara.kovacevic@gmail.com',
		guestPhone: '+381 64 220 9981',
		checkInDate: '2026-06-10',
		checkOutDate: '2026-06-14',
		numberOfAdults: 2,
		numberOfChildren: 0,
		numberOfNights: 4,
		subtotal: 340,
		cleaningFee: 25,
		total: 365,
		currency: 'EUR',
		paymentMethod: 'cash',
		paymentStatus: 'paid',
		status: 'checked_out',
		updatedAt: at('2026-06-14T10:30:00Z')
	},
	{
		_id: 'bk_12',
		_creationTime: at('2026-05-01T08:15:00Z'),
		bookingCode: 'BKY6T5R4E3',
		apartmentId: APARTMENTS.zlatibor._id,
		apartment: APARTMENTS.zlatibor,
		hostId: HOST_ID,
		guestFirstName: 'Filip',
		guestLastName: 'Marković',
		guestEmail: 'filip.markovic@gmail.com',
		guestPhone: '+381 65 778 1102',
		checkInDate: '2026-05-28',
		checkOutDate: '2026-06-04',
		numberOfAdults: 4,
		numberOfChildren: 0,
		numberOfNights: 7,
		subtotal: 1540,
		cleaningFee: 60,
		total: 1600,
		currency: 'EUR',
		paymentMethod: 'cash',
		paymentStatus: 'paid',
		status: 'checked_out',
		updatedAt: at('2026-06-04T11:00:00Z')
	},
	{
		_id: 'bk_13',
		_creationTime: at('2026-05-18T19:50:00Z'),
		bookingCode: 'BKW2Q1A9S8',
		apartmentId: APARTMENTS.vracar._id,
		apartment: APARTMENTS.vracar,
		hostId: HOST_ID,
		guestId: 'guest_teodora',
		guestFirstName: 'Teodora',
		guestLastName: 'Lazić',
		guestEmail: 'teodora.lazic@outlook.com',
		guestPhone: '+381 63 145 6620',
		checkInDate: '2026-06-01',
		checkOutDate: '2026-06-05',
		numberOfAdults: 1,
		numberOfChildren: 1,
		numberOfNights: 4,
		subtotal: 220,
		cleaningFee: 15,
		total: 235,
		currency: 'EUR',
		paymentMethod: 'cash',
		paymentStatus: 'paid',
		status: 'checked_out',
		updatedAt: at('2026-06-05T09:45:00Z')
	},
	{
		_id: 'bk_14',
		_creationTime: at('2026-04-28T14:25:00Z'),
		bookingCode: 'BKD7F6G5H4',
		apartmentId: APARTMENTS.knez._id,
		apartment: APARTMENTS.knez,
		hostId: HOST_ID,
		guestFirstName: 'Vuk',
		guestLastName: 'Popović',
		guestEmail: 'vuk.popovic@gmail.com',
		guestPhone: '+381 60 332 1190',
		checkInDate: '2026-05-15',
		checkOutDate: '2026-05-18',
		numberOfAdults: 2,
		numberOfChildren: 0,
		numberOfNights: 3,
		subtotal: 285,
		cleaningFee: 30,
		total: 315,
		currency: 'EUR',
		paymentMethod: 'cash',
		paymentStatus: 'paid',
		status: 'checked_out',
		updatedAt: at('2026-05-18T10:15:00Z')
	},
	{
		_id: 'bk_15',
		_creationTime: at('2026-05-22T07:40:00Z'),
		bookingCode: 'BKJ3K2L1Z9',
		apartmentId: APARTMENTS.riverside._id,
		apartment: APARTMENTS.riverside,
		hostId: HOST_ID,
		guestId: 'guest_katarina',
		guestFirstName: 'Katarina',
		guestLastName: 'Simić',
		guestEmail: 'katarina.simic@gmail.com',
		guestPhone: '+381 64 889 3301',
		checkInDate: '2026-06-06',
		checkOutDate: '2026-06-09',
		numberOfAdults: 2,
		numberOfChildren: 0,
		numberOfNights: 3,
		subtotal: 420,
		cleaningFee: 40,
		total: 460,
		currency: 'EUR',
		paymentMethod: 'cash',
		paymentStatus: 'paid',
		status: 'checked_out',
		updatedAt: at('2026-06-09T10:05:00Z')
	},

	// === CANCELLED ===========================================================
	{
		_id: 'bk_16',
		_creationTime: at('2026-06-05T11:11:00Z'),
		bookingCode: 'BKX8C7V6B5',
		apartmentId: APARTMENTS.skadarlija._id,
		apartment: APARTMENTS.skadarlija,
		hostId: HOST_ID,
		guestFirstName: 'Aleksandar',
		guestLastName: 'Janković',
		guestEmail: 'aleksandar.jankovic@gmail.com',
		guestPhone: '+381 65 447 9912',
		checkInDate: '2026-06-30',
		checkOutDate: '2026-07-03',
		numberOfAdults: 2,
		numberOfChildren: 0,
		numberOfNights: 3,
		subtotal: 255,
		cleaningFee: 25,
		total: 280,
		currency: 'EUR',
		paymentMethod: 'cash',
		paymentStatus: 'refunded',
		status: 'cancelled',
		updatedAt: at('2026-06-14T16:20:00Z'),
		cancelledAt: at('2026-06-14T16:20:00Z'),
		cancelledBy: 'guest',
		cancelReason: 'Change of travel plans.'
	},
	{
		_id: 'bk_17',
		_creationTime: at('2026-05-25T10:30:00Z'),
		bookingCode: 'BKN4M3Q2W1',
		apartmentId: APARTMENTS.zlatibor._id,
		apartment: APARTMENTS.zlatibor,
		hostId: HOST_ID,
		guestId: 'guest_tijana',
		guestFirstName: 'Tijana',
		guestLastName: 'Đukić',
		guestEmail: 'tijana.djukic@gmail.com',
		guestPhone: '+381 63 552 8840',
		checkInDate: '2026-07-05',
		checkOutDate: '2026-07-12',
		numberOfAdults: 5,
		numberOfChildren: 0,
		numberOfNights: 7,
		subtotal: 1540,
		cleaningFee: 60,
		total: 1600,
		currency: 'EUR',
		paymentMethod: 'cash',
		paymentStatus: 'refunded',
		status: 'cancelled',
		updatedAt: at('2026-06-10T09:00:00Z'),
		cancelledAt: at('2026-06-10T09:00:00Z'),
		cancelledBy: 'host',
		cancelReason: 'Property unavailable due to maintenance.'
	},
	{
		_id: 'bk_18',
		_creationTime: at('2026-06-08T13:45:00Z'),
		bookingCode: 'BKE9R8T7Y6',
		apartmentId: APARTMENTS.vracar._id,
		apartment: APARTMENTS.vracar,
		hostId: HOST_ID,
		guestFirstName: 'Bojan',
		guestLastName: 'Mitrović',
		guestEmail: 'bojan.mitrovic@gmail.com',
		guestPhone: '+381 64 003 2218',
		checkInDate: '2026-06-19',
		checkOutDate: '2026-06-22',
		numberOfAdults: 2,
		numberOfChildren: 0,
		numberOfNights: 3,
		subtotal: 165,
		cleaningFee: 15,
		total: 180,
		currency: 'EUR',
		paymentMethod: 'cash',
		paymentStatus: 'pending',
		status: 'cancelled',
		updatedAt: at('2026-06-13T08:30:00Z'),
		cancelledAt: at('2026-06-13T08:30:00Z'),
		cancelledBy: 'guest',
		cancelReason: 'Found alternative accommodation.'
	}
];
