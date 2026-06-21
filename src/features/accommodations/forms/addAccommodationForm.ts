// DATA
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

export const addAccommodationForm: MutationFormSection[] = [
	{
		id: 'basics',
		title: 'The basics',
		description: 'Tell guests what kind of place they are booking.',
		icon: HouseIcon,
		fields: [
			{
				id: 'title',
				label: 'Listing title',
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
				id: 'cityPlaceId',
				label: 'Address',
				kind: 'input',
				description:
					'Search for your address and pick it from the list — we’ll fill in the city, country and map pin automatically.',
				required: true,
				colSpan: 2
			},
			{
				id: 'city',
				label: 'City',
				kind: 'input',
				placeholder: 'Filled from address search',
				disabled: true,
				required: true,
				colSpan: 1
			},
			{
				id: 'country',
				label: 'Country',
				kind: 'input',
				placeholder: 'Filled from address search',
				disabled: true,
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
				kind: 'input',
				type: 'number',
				placeholder: '1',
				required: true,
				colSpan: 1
			},
			{
				id: 'bathrooms',
				label: 'Bathrooms',
				kind: 'input',
				type: 'number',
				placeholder: '1',
				required: true,
				colSpan: 1
			},
			{
				id: 'maxGuests',
				label: 'Max guests',
				kind: 'input',
				type: 'number',
				placeholder: '2',
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
		description: 'All amounts are in whole euros (€).',
		icon: BanknoteIcon,
		fields: [
			{
				id: 'pricePerNight',
				label: 'Price per night',
				kind: 'input',
				type: 'number',
				placeholder: '80',
				required: true,
				colSpan: 1
			},
			{
				id: 'cleaningFee',
				label: 'Cleaning fee',
				kind: 'input',
				type: 'number',
				placeholder: 'Optional',
				colSpan: 1
			},
			{
				id: 'weekendPremium',
				label: 'Weekend price (Fri–Sat)',
				kind: 'input',
				type: 'number',
				placeholder: 'Optional',
				colSpan: 1
			},
			{
				id: 'discountAmount',
				label: 'Discounted nightly price',
				kind: 'input',
				type: 'number',
				placeholder: 'Optional',
				description: 'When set, the regular price is shown crossed out.',
				colSpan: 1
			},
			{
				id: 'weeklyDiscount',
				label: 'Weekly discount (%)',
				kind: 'input',
				type: 'number',
				placeholder: 'Optional',
				colSpan: 1
			},
			{
				id: 'monthlyDiscount',
				label: 'Monthly discount (%)',
				kind: 'input',
				type: 'number',
				placeholder: 'Optional',
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
				kind: 'input',
				type: 'time',
				required: true,
				colSpan: 1
			},
			{
				id: 'checkOutTime',
				label: 'Check-out time',
				kind: 'input',
				type: 'time',
				required: true,
				colSpan: 1
			},
			{
				id: 'minReservationDays',
				label: 'Minimum nights',
				kind: 'input',
				type: 'number',
				placeholder: '1',
				required: true,
				colSpan: 1
			},
			{
				id: 'maxReservationDays',
				label: 'Maximum nights',
				kind: 'input',
				type: 'number',
				placeholder: 'No limit',
				colSpan: 1
			},
			{
				id: 'quietHoursStart',
				label: 'Quiet hours start',
				kind: 'input',
				type: 'time',
				colSpan: 1
			},
			{ id: 'quietHoursEnd', label: 'Quiet hours end', kind: 'input', type: 'time', colSpan: 1 }
		]
	},
	{
		id: 'house-policies',
		title: 'House policies',
		description: 'How guests can book, and what’s allowed on the property.',
		icon: ShieldCheckIcon,
		fields: [
			{
				id: 'instantBooking',
				label: 'Instant booking',
				kind: 'toggle',
				icon: ZapIcon,
				description: 'Guests can book without waiting for your approval.',
				colSpan: 1
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
		description: 'Select everything your place offers.',
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
		description: 'Listings with great photos get more bookings. Add a few to finish.',
		icon: ImagesIcon,
		fields: [
			{
				id: 'photos',
				label: 'Upload photos',
				kind: 'upload-multiple',
				accept: 'image/*',
				colSpan: 2
			}
		]
	}
];
