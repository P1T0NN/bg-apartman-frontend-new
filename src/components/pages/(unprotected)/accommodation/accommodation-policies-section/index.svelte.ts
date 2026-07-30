// UTILS
import { formatTime12 } from '@/shared/utils/dateUtils';
import { formatUpToGuests } from '@/utils/formatters';

// TYPES
import type { typesAccommodationEnriched } from '@/shared/features/accommodation/types/accommodationTypes';
import type { AccommodationPolicyRule } from './types';

// LUCIDE ICONS
import CalendarIcon from '@lucide/svelte/icons/calendar';
import CigaretteIcon from '@lucide/svelte/icons/cigarette';
import CigaretteOffIcon from '@lucide/svelte/icons/cigarette-off';
import ClockIcon from '@lucide/svelte/icons/clock';
import DogIcon from '@lucide/svelte/icons/dog';
import MoonIcon from '@lucide/svelte/icons/moon';
import PartyPopperIcon from '@lucide/svelte/icons/party-popper';
import UsersIcon from '@lucide/svelte/icons/users';
import ZapIcon from '@lucide/svelte/icons/zap';

function buildHouseRules(accommodation: typesAccommodationEnriched): AccommodationPolicyRule[] {
	const rules: AccommodationPolicyRule[] = [
		{
			icon: ClockIcon,
			label: `Check-in after ${formatTime12(accommodation.checkInTime)}`
		},
		{
			icon: ClockIcon,
			label: `Checkout before ${formatTime12(accommodation.checkOutTime)}`
		},
		{ icon: UsersIcon, label: formatUpToGuests(accommodation.maxGuests) },
		{
			icon: DogIcon,
			label: accommodation.petsAllowed ? 'Pets allowed' : 'No pets'
		},
		{
			icon: accommodation.smokingAllowed ? CigaretteIcon : CigaretteOffIcon,
			label: accommodation.smokingAllowed ? 'Smoking allowed' : 'No smoking'
		},
		{
			icon: PartyPopperIcon,
			label: accommodation.partiesAllowed ? 'Events allowed' : 'No parties or events'
		}
	];

	if (accommodation.quietHoursStart && accommodation.quietHoursEnd) {
		rules.push({
			icon: MoonIcon,
			label: `Quiet hours ${accommodation.quietHoursStart}–${accommodation.quietHoursEnd}`
		});
	}

	return rules;
}

function buildBookingRules(accommodation: typesAccommodationEnriched): AccommodationPolicyRule[] {
	const rules: AccommodationPolicyRule[] = [
		{
			icon: CalendarIcon,
			label: `Minimum stay ${accommodation.minReservationDays} nights`
		}
	];

	if (accommodation.maxReservationDays) {
		rules.push({
			icon: CalendarIcon,
			label: `Maximum stay ${accommodation.maxReservationDays} nights`
		});
	}

	rules.push({
		icon: ZapIcon,
		label: accommodation.instantBooking ? 'Instant booking' : 'Request to book'
	});

	rules.push({
		icon: ClockIcon,
		label: accommodation.sameDayReservation ? 'Same-day bookings accepted' : 'No same-day bookings'
	});

	return rules;
}

/** Pure policy rows for the accommodation detail page — re-run via `$derived` in the consumer. */
export function createAccommodationPoliciesRules(accommodation: typesAccommodationEnriched) {
	return {
		houseRules: buildHouseRules(accommodation),
		bookingRules: buildBookingRules(accommodation)
	};
}
