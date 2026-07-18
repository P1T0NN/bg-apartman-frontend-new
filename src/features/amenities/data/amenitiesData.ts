// LIBRARIES
import { m } from '@/shared/lib/paraglide/messages';

// TYPES
import type { Component } from 'svelte';

// LUCIDE ICONS
import WifiIcon from '@lucide/svelte/icons/wifi';
import SnowflakeIcon from '@lucide/svelte/icons/snowflake';
import FlameIcon from '@lucide/svelte/icons/flame';
import CookingPotIcon from '@lucide/svelte/icons/cooking-pot';
import WashingMachineIcon from '@lucide/svelte/icons/washing-machine';
import ShirtIcon from '@lucide/svelte/icons/shirt';
import CarIcon from '@lucide/svelte/icons/car';
import WavesIcon from '@lucide/svelte/icons/waves';
import TvIcon from '@lucide/svelte/icons/tv';
import LaptopIcon from '@lucide/svelte/icons/laptop';
import ArrowUpDownIcon from '@lucide/svelte/icons/arrow-up-down';
import SunIcon from '@lucide/svelte/icons/sun';
import DropletsIcon from '@lucide/svelte/icons/droplets';
import CoffeeIcon from '@lucide/svelte/icons/coffee';
import KeyRoundIcon from '@lucide/svelte/icons/key-round';
import BellRingIcon from '@lucide/svelte/icons/bell-ring';
import ShowerHeadIcon from '@lucide/svelte/icons/shower-head';
import BathIcon from '@lucide/svelte/icons/bath';
import TowelRackIcon from '@lucide/svelte/icons/towel-rack';
import BubblesIcon from '@lucide/svelte/icons/bubbles';
import ThermometerSunIcon from '@lucide/svelte/icons/thermometer-sun';
import CircleParkingIcon from '@lucide/svelte/icons/circle-parking';
import ParkingMeterIcon from '@lucide/svelte/icons/parking-meter';
import ScrollIcon from '@lucide/svelte/icons/scroll';
import SoapDispenserDropletIcon from '@lucide/svelte/icons/soap-dispenser-droplet';
import FerrisWheelIcon from '@lucide/svelte/icons/ferris-wheel';

/** Curated amenity options rendered as toggle chips by the amenities field. */
export const AMENITIES = [
	{ id: 'wifi', label: m['Amenities.wifi']() },
	{ id: 'air_conditioning', label: m['Amenities.airConditioning']() },
	{ id: 'heating', label: m['Amenities.heating']() },
	{ id: 'kitchen', label: m['Amenities.kitchen']() },
	{ id: 'washer', label: m['Amenities.washer']() },
	{ id: 'dryer', label: m['Amenities.dryer']() },
	{ id: 'free_parking', label: m['Amenities.freeParking']() },
	{ id: 'pool', label: m['Amenities.pool']() },
	{ id: 'tv', label: m['Amenities.tv']() },
	{ id: 'workspace', label: m['Amenities.dedicatedWorkspace']() },
	{ id: 'elevator', label: m['Amenities.elevator']() },
	{ id: 'balcony', label: m['Amenities.balcony']() },
	{ id: 'dishwasher', label: m['Amenities.dishwasher']() },
	{ id: 'coffee_maker', label: m['Amenities.coffeeMaker']() },
	{ id: 'self_checkin', label: m['Amenities.selfCheckin']() },
	{ id: 'smoke_alarm', label: m['Amenities.smokeAlarm']() },
	{ id: 'shower', label: m['Amenities.shower']() },
	{ id: 'bathtub', label: m['Amenities.bathtub']() },
	{ id: 'towels', label: m['Amenities.towels']() },
	{ id: 'hot_tub', label: m['Amenities.hotTub']() },
	{ id: 'sauna', label: m['Amenities.sauna']() },
	{ id: 'private_parking', label: m['Amenities.privateParking']() },
	{ id: 'public_parking', label: m['Amenities.publicParking']() },
	{ id: 'toilet_paper', label: m['Amenities.toiletPaper']() },
	{ id: 'shampoo', label: m['Amenities.shampoo']() },
	{ id: 'childrens_playground', label: m['Amenities.childrensPlayground']() }
] as const;

/** Lucide icon per amenity id — used on accommodation pages and forms. */
export const AMENITY_ICONS: Record<string, Component> = {
	wifi: WifiIcon,
	air_conditioning: SnowflakeIcon,
	heating: FlameIcon,
	kitchen: CookingPotIcon,
	washer: WashingMachineIcon,
	dryer: ShirtIcon,
	free_parking: CarIcon,
	pool: WavesIcon,
	tv: TvIcon,
	workspace: LaptopIcon,
	elevator: ArrowUpDownIcon,
	balcony: SunIcon,
	dishwasher: DropletsIcon,
	coffee_maker: CoffeeIcon,
	self_checkin: KeyRoundIcon,
	smoke_alarm: BellRingIcon,
	shower: ShowerHeadIcon,
	bathtub: BathIcon,
	towels: TowelRackIcon,
	hot_tub: BubblesIcon,
	sauna: ThermometerSunIcon,
	private_parking: CircleParkingIcon,
	public_parking: ParkingMeterIcon,
	toilet_paper: ScrollIcon,
	shampoo: SoapDispenserDropletIcon,
	childrens_playground: FerrisWheelIcon
};
