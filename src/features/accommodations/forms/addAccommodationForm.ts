import { m } from '@/lib/paraglide/messages';

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
	title: m['HostAddAccommodationPage.AddAccommodationForm.paymentsAndPlan'](),
	description: monetizationActive()
		? m['HostAddAccommodationPage.AddAccommodationForm.paymentsAndPlanDescription']()
		: m['HostAddAccommodationPage.AddAccommodationForm.paymentsDescription'](),
	icon: WalletIcon,
	fields: [
		{
			id: 'paymentMethod',
			label: m['HostAddAccommodationPage.AddAccommodationForm.guestPaymentMethod'](),
			kind: 'radio',
			options: ACCOMMODATION_PAYMENT_METHOD_OPTIONS,
			description: m['HostAddAccommodationPage.AddAccommodationForm.choosePaymentMethodDescription'](),
			colSpan: 2
		},
		...(monetizationActive()
			? [
					{
						id: 'monetization',
						label: m['HostAddAccommodationPage.AddAccommodationForm.yourPlan'](),
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
		title: m['HostAddAccommodationPage.AddAccommodationForm.theBasics'](),
		description: m['HostAddAccommodationPage.AddAccommodationForm.basicsDescription'](),
		icon: HouseIcon,
		fields: [
			{
				id: 'title',
				label: m['HostAddAccommodationPage.AddAccommodationForm.accommodationTitle'](),
				kind: 'input',
				placeholder: m['HostAddAccommodationPage.AddAccommodationForm.titlePlaceholder'](),
				autofocus: true,
				required: true,
				colSpan: 1
			},
			{
				id: 'type',
				label: m['HostAddAccommodationPage.AddAccommodationForm.propertyType'](),
				kind: 'select',
				options: ACCOMMODATION_TYPES,
				selectPlaceholder: m['HostAddAccommodationPage.AddAccommodationForm.selectType'](),
				required: true,
				colSpan: 1
			},
			{
				id: 'description',
				label: m['HostAddAccommodationPage.AddAccommodationForm.descriptionLabel'](),
				kind: 'textarea',
				rows: 5,
				placeholder: m['HostAddAccommodationPage.AddAccommodationForm.descriptionPlaceholder'](),
				required: true,
				colSpan: 2
			}
		]
	},
	{
		id: 'location',
		title: m['HostAddAccommodationPage.AddAccommodationForm.location'](),
		description: m['HostAddAccommodationPage.AddAccommodationForm.locationDescription'](),
		icon: MapPinIcon,
		fields: [
			{
				id: 'placeId',
				label: m['HostAddAccommodationPage.AddAccommodationForm.city'](),
				kind: 'input',
				description: m['HostAddAccommodationPage.AddAccommodationForm.cityDescription'](),
				required: true,
				colSpan: 2
			},
			{
				id: 'country',
				label: m['HostAddAccommodationPage.AddAccommodationForm.country'](),
				kind: 'input',
				placeholder: m['HostAddAccommodationPage.AddAccommodationForm.countryPlaceholder'](),
				disabled: true,
				colSpan: 2
			},
			{
				id: 'address',
				label: m['HostAddAccommodationPage.AddAccommodationForm.streetName'](),
				kind: 'input',
				description: m['HostAddAccommodationPage.AddAccommodationForm.streetNameDescription'](),
				colSpan: 2
			},
			{
				id: 'addressNumber',
				label: m['HostAddAccommodationPage.AddAccommodationForm.streetNumber'](),
				kind: 'input',
				placeholder: m['HostAddAccommodationPage.AddAccommodationForm.streetNumberPlaceholder'](),
				colSpan: 1
			},
			{ id: 'coordinates', label: m['HostAddAccommodationPage.AddAccommodationForm.pinOnMap'](), kind: 'input', colSpan: 2 }
		]
	},
	{
		id: 'capacity',
		title: m['HostAddAccommodationPage.AddAccommodationForm.spaceAndCapacity'](),
		description: m['HostAddAccommodationPage.AddAccommodationForm.spaceAndCapacityDescription'](),
		icon: UsersIcon,
		fields: [
			{
				id: 'bedrooms',
				label: m['HostAddAccommodationPage.AddAccommodationForm.bedrooms'](),
				kind: 'counter',
				placeholder: m['HostAddAccommodationPage.AddAccommodationForm.bedroomsPlaceholder'](),
				description: m['HostAddAccommodationPage.AddAccommodationForm.bedroomsDescription'](),
				required: true,
				colSpan: 1
			},
			{
				id: 'bathrooms',
				label: m['HostAddAccommodationPage.AddAccommodationForm.bathrooms'](),
				kind: 'counter',
				placeholder: m['HostAddAccommodationPage.AddAccommodationForm.bathroomsPlaceholder'](),
				required: true,
				colSpan: 1
			},
			{
				id: 'maxGuests',
				label: m['HostAddAccommodationPage.AddAccommodationForm.maxGuests'](),
				kind: 'counter',
				placeholder: m['HostAddAccommodationPage.AddAccommodationForm.maxGuestsPlaceholder'](),
				required: true,
				colSpan: 1
			},
			{
				id: 'squareMeters',
				label: m['HostAddAccommodationPage.AddAccommodationForm.sizeM2'](),
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
		title: m['HostAddAccommodationPage.AddAccommodationForm.pricing'](),
		description: m['HostAddAccommodationPage.AddAccommodationForm.pricingDescription'](),
		icon: BanknoteIcon,
		fields: [
			{
				id: 'pricePerNight',
				label: m['HostAddAccommodationPage.AddAccommodationForm.pricePerNight'](),
				kind: 'input',
				type: 'number',
				placeholder: '80',
				description: m['HostAddAccommodationPage.AddAccommodationForm.pricePerNightDescription'](),
				required: true,
				colSpan: 1
			},
			{
				id: 'discountAmount',
				label: m['HostAddAccommodationPage.AddAccommodationForm.discount'](),
				kind: 'input',
				type: 'number',
				placeholder: m['HostAddAccommodationPage.AddAccommodationForm.leaveEmptyForNone'](),
				description: m['HostAddAccommodationPage.AddAccommodationForm.discountDescription'](),
				colSpan: 1
			},
			{
				// A hairline splits the two base-rate fields above from the optional
				// adjustments below — same step, clearly separated (mutation-form divider).
				id: 'pricingDivider',
				kind: 'divider',
				label: m['HostAddAccommodationPage.AddAccommodationForm.optional'](),
				colSpan: 2
			},
			{
				id: 'weekendPremium',
				label: m['HostAddAccommodationPage.AddAccommodationForm.weekendPrice'](),
				kind: 'input',
				type: 'number',
				placeholder: m['HostAddAccommodationPage.AddAccommodationForm.leaveEmptyForNone'](),
				description: m['HostAddAccommodationPage.AddAccommodationForm.weekendPremiumDescription'](),
				colSpan: 1
			},
			{
				id: 'weeklyDiscount',
				label: m['HostAddAccommodationPage.AddAccommodationForm.weeklyDiscount'](),
				kind: 'input',
				type: 'number',
				placeholder: m['HostAddAccommodationPage.AddAccommodationForm.leaveEmptyForNone'](),
				description: m['HostAddAccommodationPage.AddAccommodationForm.weeklyDiscountDescription'](),
				colSpan: 1
			},
			{
				id: 'cleaningFee',
				label: m['HostAddAccommodationPage.AddAccommodationForm.cleaningFee'](),
				kind: 'input',
				type: 'number',
				placeholder: m['HostAddAccommodationPage.AddAccommodationForm.leaveEmptyForNone'](),
				description: m['HostAddAccommodationPage.AddAccommodationForm.cleaningFeeDescription'](),
				colSpan: 1
			}
		]
	},
	{
		id: 'times-limits',
		title: m['HostAddAccommodationPage.AddAccommodationForm.timesAndLimits'](),
		description: m['HostAddAccommodationPage.AddAccommodationForm.timesAndLimitsDescription'](),
		icon: ClockIcon,
		fields: [
			{
				id: 'checkInTime',
				label: m['HostAddAccommodationPage.AddAccommodationForm.checkInTime'](),
				kind: 'select',
				options: HOUR_OPTIONS,
				selectPlaceholder: m['HostAddAccommodationPage.AddAccommodationForm.selectTime'](),
				required: true,
				colSpan: 1
			},
			{
				id: 'checkOutTime',
				label: m['HostAddAccommodationPage.AddAccommodationForm.checkOutTime'](),
				kind: 'select',
				options: HOUR_OPTIONS,
				selectPlaceholder: m['HostAddAccommodationPage.AddAccommodationForm.selectTime'](),
				required: true,
				colSpan: 1
			},
			{
				id: 'minReservationDays',
				label: m['HostAddAccommodationPage.AddAccommodationForm.minimumNights'](),
				kind: 'input',
				type: 'number',
				placeholder: '1',
				description: m['HostAddAccommodationPage.AddAccommodationForm.minimumNightsDescription'](),
				required: true,
				colSpan: 1
			},
			{
				id: 'maxReservationDays',
				label: m['HostAddAccommodationPage.AddAccommodationForm.maximumNights'](),
				kind: 'input',
				type: 'number',
				placeholder: m['HostAddAccommodationPage.AddAccommodationForm.noLimit'](),
				description: m['HostAddAccommodationPage.AddAccommodationForm.maximumNightsDescription'](),
				colSpan: 1
			},
			{
				id: 'quietHoursStart',
				label: m['HostAddAccommodationPage.AddAccommodationForm.quietHoursStart'](),
				kind: 'time',
				placeholder: 'HH:MM',
				description: m['HostAddAccommodationPage.AddAccommodationForm.quietHoursStartDescription'](),
				colSpan: 1
			},
			{
				id: 'quietHoursEnd',
				label: m['HostAddAccommodationPage.AddAccommodationForm.quietHoursEnd'](),
				kind: 'time',
				placeholder: 'HH:MM',
				description: m['HostAddAccommodationPage.AddAccommodationForm.quietHoursEndDescription'](),
				colSpan: 1
			}
		]
	},
	{
		id: 'house-policies',
		title: m['HostAddAccommodationPage.AddAccommodationForm.housePolicies'](),
		description: m['HostAddAccommodationPage.AddAccommodationForm.housePoliciesDescription'](),
		icon: ShieldCheckIcon,
		fields: [
			// `paymentMethod` moved to the final "Payments & plan" step — it belongs with the
			// plan it is coupled to, not among the property's house rules.
			{
				id: 'instantBooking',
				label: m['HostAddAccommodationPage.AddAccommodationForm.instantBooking'](),
				kind: 'toggle',
				icon: ZapIcon,
				description: m['HostAddAccommodationPage.AddAccommodationForm.instantBookingDescription'](),
				colSpan: 2
			},
			{
				id: 'sameDayReservation',
				label: m['HostAddAccommodationPage.AddAccommodationForm.sameDayReservations'](),
				kind: 'toggle',
				icon: CalendarClockIcon,
				description: m['HostAddAccommodationPage.AddAccommodationForm.sameDayReservationsDescription'](),
				colSpan: 1
			},
			{
				id: 'singleDayReservation',
				label: m['HostAddAccommodationPage.AddAccommodationForm.singleDayStays'](),
				kind: 'toggle',
				icon: SunIcon,
				description: m['HostAddAccommodationPage.AddAccommodationForm.singleDayStaysDescription'](),
				colSpan: 1
			},
			{
				id: 'petsAllowed',
				label: m['HostAddAccommodationPage.AddAccommodationForm.pets'](),
				kind: 'toggle',
				icon: PawPrintIcon,
				description: m['HostAddAccommodationPage.AddAccommodationForm.petsDescription'](),
				colSpan: 1
			},
			{
				id: 'smokingAllowed',
				label: m['HostAddAccommodationPage.AddAccommodationForm.smoking'](),
				kind: 'toggle',
				icon: CigaretteIcon,
				description: m['HostAddAccommodationPage.AddAccommodationForm.smokingDescription'](),
				colSpan: 1
			},
			{
				id: 'partiesAllowed',
				label: m['HostAddAccommodationPage.AddAccommodationForm.partiesAndEvents'](),
				kind: 'toggle',
				icon: PartyPopperIcon,
				description: m['HostAddAccommodationPage.AddAccommodationForm.partiesAndEventsDescription'](),
				colSpan: 1
			}
		]
	},
	{
		id: 'amenities',
		title: m['HostAddAccommodationPage.AddAccommodationForm.amenities'](),
		description: m['HostAddAccommodationPage.AddAccommodationForm.amenitiesDescription'](),
		icon: SparklesIcon,
		fields: [{ id: 'amenities', label: m['HostAddAccommodationPage.AddAccommodationForm.whatThisPlaceOffers'](), kind: 'input', colSpan: 2 }]
	},
	{
		id: 'house-rules',
		title: m['HostAddAccommodationPage.AddAccommodationForm.houseRules'](),
		description: m['HostAddAccommodationPage.AddAccommodationForm.houseRulesDescription'](),
		icon: ScrollTextIcon,
		fields: [
			{
				id: 'houseRules',
				label: m['HostAddAccommodationPage.AddAccommodationForm.additionalHouseRules'](),
				kind: 'textarea',
				rows: 4,
				placeholder: m['HostAddAccommodationPage.AddAccommodationForm.houseRulesPlaceholder'](),
				colSpan: 2
			}
		]
	},
	{
		id: 'photos',
		title: m['HostAddAccommodationPage.AddAccommodationForm.photos'](),
		description: m['HostAddAccommodationPage.AddAccommodationForm.photosDescription'](),
		icon: ImagesIcon,
		fields: [
			{
				id: 'photos',
				label: m['HostAddAccommodationPage.AddAccommodationForm.uploadPhotos'](),
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
		title: m['HostAddAccommodationPage.AddAccommodationForm.ownerOfApartment'](),
		description: m['HostAddAccommodationPage.AddAccommodationForm.ownerOfApartmentDescription'](),
		icon: UserIcon,
		fields: [
			{
				id: 'hostId',
				label: m['HostAddAccommodationPage.AddAccommodationForm.owner'](),
				kind: 'input',
				description: m['HostAddAccommodationPage.AddAccommodationForm.findOwnerDescription'](),
				required: true,
				colSpan: 2
			}
		]
	},
	...addAccommodationForm
];
