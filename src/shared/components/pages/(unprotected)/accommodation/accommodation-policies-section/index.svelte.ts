// LIBRARIES
import { m } from '@/shared/lib/paraglide/messages';

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
			label: m['AccommodationPage.AccommodationPoliciesSection.checkInAfter']({
				time: formatTime12(accommodation.checkInTime)
			})
		},
		{
			icon: ClockIcon,
			label: m['AccommodationPage.AccommodationPoliciesSection.checkoutBefore']({
				time: formatTime12(accommodation.checkOutTime)
			})
		},
		{ icon: UsersIcon, label: formatUpToGuests(accommodation.maxGuests) },
		{
			icon: DogIcon,
			label: accommodation.petsAllowed
				? m['AccommodationPage.AccommodationPoliciesSection.petsAllowed']()
				: m['AccommodationPage.AccommodationPoliciesSection.petsNotAllowed']()
		},
		{
			icon: accommodation.smokingAllowed ? CigaretteIcon : CigaretteOffIcon,
			label: accommodation.smokingAllowed
				? m['AccommodationPage.AccommodationPoliciesSection.smokingAllowed']()
				: m['AccommodationPage.AccommodationPoliciesSection.smokingNotAllowed']()
		},
		{
			icon: PartyPopperIcon,
			label: accommodation.partiesAllowed
				? m['AccommodationPage.AccommodationPoliciesSection.partiesAllowed']()
				: m['AccommodationPage.AccommodationPoliciesSection.partiesNotAllowed']()
		}
	];

	if (accommodation.quietHoursStart && accommodation.quietHoursEnd) {
		rules.push({
			icon: MoonIcon,
			label: m['AccommodationPage.AccommodationPoliciesSection.quietHours']({
				start: accommodation.quietHoursStart,
				end: accommodation.quietHoursEnd
			})
		});
	}

	return rules;
}

function buildBookingRules(accommodation: typesAccommodationEnriched): AccommodationPolicyRule[] {
	const rules: AccommodationPolicyRule[] = [
		{
			icon: CalendarIcon,
			label: m['AccommodationPage.AccommodationPoliciesSection.minimumStay']({
				nights: accommodation.minReservationDays
			})
		}
	];

	if (accommodation.maxReservationDays) {
		rules.push({
			icon: CalendarIcon,
			label: m['AccommodationPage.AccommodationPoliciesSection.maximumStay']({
				nights: accommodation.maxReservationDays
			})
		});
	}

	rules.push({
		icon: ZapIcon,
		label: accommodation.instantBooking
			? m['AccommodationPage.AccommodationPoliciesSection.instantBooking']()
			: m['AccommodationPage.AccommodationPoliciesSection.requestToBook']()
	});

	rules.push({
		icon: ClockIcon,
		label: accommodation.sameDayReservation
			? m['AccommodationPage.AccommodationPoliciesSection.sameDayBookingsAccepted']()
			: m['AccommodationPage.AccommodationPoliciesSection.noSameDayBookings']()
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
