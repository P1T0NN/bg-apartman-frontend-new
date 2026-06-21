// TYPES
import type { MutationFormSelectOption } from '@/shared/components/ui/mutation-form/types';

/** Property types — mirrors `apartmentType` in accommodationsSchemas.ts. */
export const ACCOMMODATION_TYPES: MutationFormSelectOption[] = [
	{ value: 'apartment', label: 'Apartment' },
	{ value: 'studio', label: 'Studio' },
	{ value: 'penthouse', label: 'Penthouse' },
	{ value: 'loft', label: 'Loft' },
	{ value: 'duplex', label: 'Duplex' },
	{ value: 'house', label: 'House' },
	{ value: 'villa', label: 'Villa' }
];
