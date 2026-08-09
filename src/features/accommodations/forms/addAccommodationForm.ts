// DATA
import { ACCOMMODATION_PAYMENT_METHOD_OPTIONS } from '@/features/bookings/data/paymentMethods';
import { ACCOMMODATION_TYPES } from '@/shared/data/accommodationsData';

// UTILS
import { monetizationActive } from '@/shared/features/accommodation/utils/listingFeeState';

// TYPES
import type { MutationFormSection } from '@/components/ui/mutation-form/types';

// LUCIDE ICONS
import HouseIcon from '@lucide/svelte/icons/house';
import MapPinIcon from '@lucide/svelte/icons/map-pin';
import UsersIcon from '@lucide/svelte/icons/users';
import UserIcon from '@lucide/svelte/icons/user';
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
import WalletIcon from '@lucide/svelte/icons/wallet';

/**
 * The final step: how money moves for this listing — what guests may pay with, and which
 * plan the listing runs on (ASD §8).
 *
 * The two live together because they are ONE decision with two halves: the per-booking
 * plan is online-only by construction, so picking it sets the payment method, and a host
 * reading either field needs the other in view. It is the LAST step because it is the
 * commitment — everything before it describes the property, this decides the deal, and the
 * per-booking half cannot be undone once the listing exists.
 *
 * `monetization` drops out entirely while `MONETIZATION: 'none'` (no plan to choose), and
 * the edit form strips it too — the plan is not editable, only switchable one way through
 * its own mutation (§2/A3, §8 "Switching models"). Payment method stays editable.
 */
export const PAYMENTS_SECTION_ID = 'payments-plan';

const paymentsSection: MutationFormSection = {
	id: PAYMENTS_SECTION_ID,
	title: 'Payments & plan',
	description: monetizationActive()
		? 'How guests pay you, and how this listing pays for being on the platform. The per-booking plan is permanent for this listing — pick carefully.'
		: 'How guests pay you for their stay.',
	icon: WalletIcon,
	fields: [
		{
			id: 'paymentMethod',
			label: 'Guest payment method',
			kind: 'radio',
			options: ACCOMMODATION_PAYMENT_METHOD_OPTIONS,
			description: 'Choose how guests pay for their stay.',
			colSpan: 2
		},
		...(monetizationActive()
			? [
					{
						id: 'monetization',
						label: 'Your plan',
						kind: 'input' as const,
						required: true,
						colSpan: 2 as const
					}
				]
			: [])
	]
};

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
				colSpan: 1
			},
			{
				id: 'discountAmount',
				label: 'Discount',
				kind: 'input',
				type: 'number',
				placeholder: 'Leave empty for none',
				description:
					'A lower nightly price shown to guests, with the regular price crossed out beside it. Leave empty for no discount.',
				colSpan: 1
			},
			{
				// A hairline splits the two base-rate fields above from the optional
				// adjustments below — same step, clearly separated (mutation-form divider).
				id: 'pricingDivider',
				kind: 'divider',
				label: 'Optional',
				colSpan: 2
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
				id: 'cleaningFee',
				label: 'Cleaning fee',
				kind: 'input',
				type: 'number',
				placeholder: 'Leave empty for none',
				description:
					'A one-time fee added once per booking, on top of the nightly price. Leave empty if you don’t charge one.',
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
			// `paymentMethod` moved to the final "Payments & plan" step — it belongs with the
			// plan it is coupled to, not among the property's house rules.
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
	},
	// Last on purpose — see `paymentsSection`: the property is described, now the deal is set.
	paymentsSection
];

/**
 * The admin twin of {@link addAccommodationForm} — same steps, plus the admin-only first step:
 * who the listing is created for. The owner field id is `hostId` on purpose — it is the exact
 * key `adminAddAccommodationSchema` requires, so the wizard's per-step validation surfaces
 * "pick an owner" on Continue. Deliberately NOT merged into `addAccommodationForm`: that array
 * also feeds the host's own add-accommodation form, which must never see an owner step.
 */
export const adminAddAccommodationForm: MutationFormSection[] = [
	{
		id: 'owner',
		title: 'Owner of apartment',
		description: 'Create this listing on behalf of its owner.',
		icon: UserIcon,
		fields: [
			{
				id: 'hostId',
				label: 'Owner',
				kind: 'input',
				description: 'Find the owner by name or email.',
				required: true,
				colSpan: 2
			}
		]
	},
	...addAccommodationForm
];
