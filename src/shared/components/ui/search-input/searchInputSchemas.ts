// LIBRARIES
import { z } from 'zod';

// CONFIG
import { PAGINATION_DATA } from '@/shared/config.js';

export const searchInputRemoteSchema = z.object({
	source: z.string().min(1),
	search: z.string(),
	maxResults: z.number().int().min(1).max(PAGINATION_DATA.MAX_PAGE_SIZE).optional(),
	cursor: z.string().nullable().optional()
});

export type SearchInputRemoteSchemaInput = z.infer<typeof searchInputRemoteSchema>;
