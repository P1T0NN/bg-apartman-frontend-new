// I18N
import { m } from '@/lib/paraglide/messages';

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
	{ id: 'wifi', label: m['amenitiesData.wifi']() },
	{ id: 'air_conditioning', label: m['amenitiesData.airConditioning']() },
	{ id: 'heating', label: m['amenitiesData.heating']() },
	{ id: 'kitchen', label: m['amenitiesData.kitchen']() },
	{ id: 'washer', label: m['amenitiesData.washer']() },
	{ id: 'dryer', label: m['amenitiesData.dryer']() },
	{ id: 'free_parking', label: m['amenitiesData.freeParking']() },
	{ id: 'pool', label: m['amenitiesData.pool']() },
	{ id: 'tv', label: m['amenitiesData.tv']() },
	{ id: 'workspace', label: m['amenitiesData.workspace']() },
	{ id: 'elevator', label: m['amenitiesData.elevator']() },
	{ id: 'balcony', label: m['amenitiesData.balcony']() },
	{ id: 'dishwasher', label: m['amenitiesData.dishwasher']() },
	{ id: 'coffee_maker', label: m['amenitiesData.coffeeMaker']() },
	{ id: 'self_checkin', label: m['amenitiesData.selfCheckin']() },
	{ id: 'smoke_alarm', label: m['amenitiesData.smokeAlarm']() },
	{ id: 'shower', label: m['amenitiesData.shower']() },
	{ id: 'bathtub', label: m['amenitiesData.bathtub']() },
	{ id: 'towels', label: m['amenitiesData.towels']() },
	{ id: 'hot_tub', label: m['amenitiesData.hotTub']() },
	{ id: 'sauna', label: m['amenitiesData.sauna']() },
	{ id: 'private_parking', label: m['amenitiesData.privateParking']() },
	{ id: 'public_parking', label: m['amenitiesData.publicParking']() },
	{ id: 'toilet_paper', label: m['amenitiesData.toiletPaper']() },
	{ id: 'shampoo', label: m['amenitiesData.shampoo']() },
	{ id: 'childrens_playground', label: m['amenitiesData.childrensPlayground']() }
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
