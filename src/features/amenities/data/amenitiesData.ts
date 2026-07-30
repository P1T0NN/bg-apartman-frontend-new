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
	{ id: 'wifi', label: 'Wi-Fi' },
	{ id: 'air_conditioning', label: 'Air conditioning' },
	{ id: 'heating', label: 'Heating' },
	{ id: 'kitchen', label: 'Kitchen' },
	{ id: 'washer', label: 'Washer' },
	{ id: 'dryer', label: 'Dryer' },
	{ id: 'free_parking', label: 'Free parking' },
	{ id: 'pool', label: 'Pool' },
	{ id: 'tv', label: 'TV' },
	{ id: 'workspace', label: 'Dedicated workspace' },
	{ id: 'elevator', label: 'Elevator' },
	{ id: 'balcony', label: 'Balcony' },
	{ id: 'dishwasher', label: 'Dishwasher' },
	{ id: 'coffee_maker', label: 'Coffee maker' },
	{ id: 'self_checkin', label: 'Self check-in' },
	{ id: 'smoke_alarm', label: 'Smoke alarm' },
	{ id: 'shower', label: 'Shower' },
	{ id: 'bathtub', label: 'Bathtub' },
	{ id: 'towels', label: 'Towels' },
	{ id: 'hot_tub', label: 'Hot tub' },
	{ id: 'sauna', label: 'Sauna' },
	{ id: 'private_parking', label: 'Private parking' },
	{ id: 'public_parking', label: 'Public parking' },
	{ id: 'toilet_paper', label: 'Toilet paper' },
	{ id: 'shampoo', label: 'Shampoo' },
	{ id: 'childrens_playground', label: "Children's playground" }
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
