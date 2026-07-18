// DATA
import { ACCOMMODATION_PAYMENT_METHOD_OPTIONS } from '@/features/bookings/data/paymentMethods';
import { ACCOMMODATION_TYPES } from '@/shared/data/accommodationsData';

// TYPES
import type { MutationFormSection } from '@/shared/components/ui/mutation-form/types';

// LUCIDE ICONS
import HouseIcon from '@lucide/svelte/icons/house';
import MapPinIcon from '@lucide/svelte/icons/map-pin';
import UsersIcon from '@lucide/svelte/icons/users';
import BanknoteIcon from '@lucide/svelte/icons/banknote';
import ClockIcon from '@lucide/svelte/icons/clock';
import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
import SparklesIcon from '@lucide/svelte/icons/sparkles';
import ScrollTextIcon from '@lucide/svelte/icons/scroll-text';
import ZapIcon from '@lucide/svelte/icons/zap';
import CalendarClockIcon from '@lucide/svelte/icons/calendar-clock';
import SunIcon from '@lucide/svelte/icons/sun';
import PawPrintIcon from '@lucide/svelte/icons/paw-print';
import CigaretteIcon from '@lucide/svelte/icons/cigarette';
import PartyPopperIcon from '@lucide/svelte/icons/party-popper';
import ImagesIcon from '@lucide/svelte/icons/images';

// Check-in / check-out hour choices: 12:00 → 22:00.
const HOUR_OPTIONS = Array.from({ length: 11 }, (_, i) => {
	const time = `${String(12 + i).padStart(2, '0')}:00`;
	return { value: time, label: time };
});

export const addAccommodationForm: MutationFormSection[] = [
	{
		id: 'basics',
		title: 'The basics',
		description: 'Tell guests what kind of place they are booking.',
		icon: HouseIcon,
		fields: [
			{
				id: 'title',
				label: 'Accommodation title',
				kind: 'input',
				placeholder: 'Sunny one-bedroom near the river',
				autofocus: true,
				required: true,
				colSpan: 1
			},
			{
				id: 'type',
				label: 'Property type',
				kind: 'select',
				options: ACCOMMODATION_TYPES,
				selectPlaceholder: 'Select type',
				required: true,
				colSpan: 1
			},
			{
				id: 'description',
				label: 'Description',
				kind: 'textarea',
				rows: 5,
				placeholder: 'Describe the space, the neighbourhood and what makes it special…',
				required: true,
				colSpan: 2
			}
		]
	},
	{
		id: 'location',
		title: 'Location',
		description: 'Where will guests be staying?',
		icon: MapPinIcon,
		fields: [
			{
				id: 'placeId',
				label: 'City',
				kind: 'input',
				description:
					'Search for your city and pick it from the list — we set the country automatically and unlock the street search below.',
				required: true,
				colSpan: 2
			},
			{
				id: 'country',
				label: 'Country',
				kind: 'input',
				placeholder: 'Set automatically from your city',
				disabled: true,
				colSpan: 2
			},
			{
				id: 'address',
				label: 'Street name',
				kind: 'input',
				description: 'Pick your country or city first, then search for the street.',
				colSpan: 2
			},
			{
				id: 'addressNumber',
				label: 'Street number',
				kind: 'input',
				placeholder: 'e.g. 12a',
				colSpan: 1
			},
			{ id: 'coordinates', label: 'Pin on map', kind: 'input', colSpan: 2 }
		]
	},
	{
		id: 'capacity',
		title: 'Space & capacity',
		description: 'How many guests can comfortably stay?',
		icon: UsersIcon,
		fields: [
			{
				id: 'bedrooms',
				label: 'Bedrooms',
				kind: 'counter',
				placeholder: 'Number of bedrooms',
				description: 'Pick a number, or use Custom (e.g. 0 for a studio).',
				required: true,
				colSpan: 1
			},
			{
				id: 'bathrooms',
				label: 'Bathrooms',
				kind: 'counter',
				placeholder: 'Number of bathrooms',
				required: true,
				colSpan: 1
			},
			{
				id: 'maxGuests',
				label: 'Max guests',
				kind: 'counter',
				placeholder: 'Number of guests',
				required: true,
				colSpan: 1
			},
			{
				id: 'squareMeters',
				label: 'Size (m²)',
				kind: 'input',
				type: 'number',
				placeholder: '50',
				required: true,
				colSpan: 2
			}
		]
	},
	{
		id: 'pricing',
		title: 'Pricing',
		description:
			'Set your nightly price below. Every other field is optional — leave it empty to skip it. All amounts are in whole euros (€).',
		icon: BanknoteIcon,
		fields: [
			{
				id: 'pricePerNight',
				label: 'Price per night',
				kind: 'input',
				type: 'number',
				placeholder: '80',
				description: 'The standard rate a guest pays for one night.',
				required: true,
				colSpan: 2
			},
			{
				id: 'cleaningFee',
				label: 'Cleaning fee',
				kind: 'input',
				type: 'number',
				placeholder: 'Leave empty for none',
				description:
					'A one-time fee added once per booking, on top of the nightly price. Leave empty if you don’t charge one.',
				colSpan: 1
			},
			{
				id: 'weekendPremium',
				label: 'Weekend price (Fri–Sat)',
				kind: 'input',
				type: 'number',
				placeholder: 'Leave empty for none',
				description:
					'Charged instead of the nightly price on Friday & Saturday nights. Leave empty to keep one price all week.',
				colSpan: 1
			},
			{
				id: 'discountAmount',
				label: 'Discounted nightly price',
				kind: 'input',
				type: 'number',
				placeholder: 'Leave empty for none',
				description:
					'A lower nightly price shown to guests, with the regular price crossed out beside it. Leave empty for no discount.',
				colSpan: 1
			},
			{
				id: 'weeklyDiscount',
				label: 'Weekly discount (%)',
				kind: 'input',
				type: 'number',
				placeholder: 'Leave empty for none',
				description:
					'Percent off the total for stays of 7+ nights (e.g. 10 = 10% off). Leave empty for none.',
				colSpan: 1
			},
			{
				id: 'monthlyDiscount',
				label: 'Monthly discount (%)',
				kind: 'input',
				type: 'number',
				placeholder: 'Leave empty for none',
				description:
					'Percent off the total for stays of 28+ nights (e.g. 20 = 20% off). Leave empty for none.',
				colSpan: 1
			}
		]
	},
	{
		id: 'times-limits',
		title: 'Times & limits',
		description: 'Check-in and out, how long guests can stay, and quiet hours.',
		icon: ClockIcon,
		fields: [
			{
				id: 'checkInTime',
				label: 'Check-in time',
				kind: 'select',
				options: HOUR_OPTIONS,
				selectPlaceholder: 'Select time',
				required: true,
				colSpan: 1
			},
			{
				id: 'checkOutTime',
				label: 'Check-out time',
				kind: 'select',
				options: HOUR_OPTIONS,
				selectPlaceholder: 'Select time',
				required: true,
				colSpan: 1
			},
			{
				id: 'minReservationDays',
				label: 'Minimum nights',
				kind: 'input',
				type: 'number',
				placeholder: '1',
				description: 'The fewest nights a guest can book in a single stay.',
				required: true,
				colSpan: 1
			},
			{
				id: 'maxReservationDays',
				label: 'Maximum nights',
				kind: 'input',
				type: 'number',
				placeholder: 'No limit',
				description: 'The most nights a guest can book in a single stay. Leave empty for no limit.',
				colSpan: 1
			},
			{
				id: 'quietHoursStart',
				label: 'Quiet hours start',
				kind: 'time',
				placeholder: 'HH:MM',
				description:
					'When guests should start keeping noise down (e.g. 22:00). Leave empty for none.',
				colSpan: 1
			},
			{
				id: 'quietHoursEnd',
				label: 'Quiet hours end',
				kind: 'time',
				placeholder: 'HH:MM',
				description: 'When quiet hours end the next morning (e.g. 08:00). Leave empty for none.',
				colSpan: 1
			}
		]
	},
	{
		id: 'house-policies',
		title: 'House policies',
		description: 'How guests can book, and what’s allowed on the property.',
		icon: ShieldCheckIcon,
		fields: [
			{
				id: 'paymentMethod',
				label: 'Guest payment method',
				kind: 'radio',
				options: ACCOMMODATION_PAYMENT_METHOD_OPTIONS,
				description: 'Choose how guests pay for their stay.',
				colSpan: 2
			},
			{
				id: 'instantBooking',
				label: 'Instant booking',
				kind: 'toggle',
				icon: ZapIcon,
				description: 'Guests can book without waiting for your approval.',
				colSpan: 2
			},
			{
				id: 'sameDayReservation',
				label: 'Same-day reservations',
				kind: 'toggle',
				icon: CalendarClockIcon,
				description: 'Allow stays that start today.',
				colSpan: 1
			},
			{
				id: 'singleDayReservation',
				label: 'Single-day stays',
				kind: 'toggle',
				icon: SunIcon,
				description: 'Check-in and check-out on the same day.',
				colSpan: 1
			},
			{
				id: 'petsAllowed',
				label: 'Pets',
				kind: 'toggle',
				icon: PawPrintIcon,
				description: 'Guests can bring pets.',
				colSpan: 1
			},
			{
				id: 'smokingAllowed',
				label: 'Smoking',
				kind: 'toggle',
				icon: CigaretteIcon,
				description: 'Smoking is allowed on the property.',
				colSpan: 1
			},
			{
				id: 'partiesAllowed',
				label: 'Parties & events',
				kind: 'toggle',
				icon: PartyPopperIcon,
				description: 'Events and gatherings are allowed.',
				colSpan: 1
			}
		]
	},
	{
		id: 'amenities',
		title: 'Amenities',
		description: 'Select everything your place offers — pick at least 5 to continue.',
		icon: SparklesIcon,
		fields: [{ id: 'amenities', label: 'What this place offers', kind: 'input', colSpan: 2 }]
	},
	{
		id: 'house-rules',
		title: 'House rules',
		description: 'Anything guests should know before they book.',
		icon: ScrollTextIcon,
		fields: [
			{
				id: 'houseRules',
				label: 'Additional house rules',
				kind: 'textarea',
				rows: 4,
				placeholder: 'Anything else guests should know? (optional)',
				colSpan: 2
			}
		]
	},
	{
		id: 'photos',
		title: 'Photos',
		description: 'Accommodations with great photos get more bookings. Add a few to finish.',
		icon: ImagesIcon,
		fields: [
			{
				id: 'photos',
				label: 'Upload photos',
				kind: 'upload-multiple',
				accept: 'image/*',
				hasCoverImage: true,
				colSpan: 2
			}
		]
	}
];
