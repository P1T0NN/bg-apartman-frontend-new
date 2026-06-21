// SVELTEKIT IMPORTS
import type { RequestEvent } from '@sveltejs/kit';

export interface GeoData {
	country?: string;
	region?: string;
	city?: string;
}

/**
 * Checks if an IP address is private/localhost
 */
function isPrivateIp(ip: string): boolean {
	const ipLower = ip.toLowerCase();

	// Check localhost
	if (ipLower === 'localhost' || ipLower === '127.0.0.1' || ipLower === '::1') {
		return true;
	}

	// Check IPv4 patterns
	if (ipLower.startsWith('127.')) {
		return true;
	}
	if (ipLower.startsWith('10.')) {
		return true;
	}
	if (ipLower.startsWith('172.')) {
		// Check if it's in the 172.16.0.0 - 172.31.255.255 range
		const parts = ipLower.split('.');
		if (parts.length >= 2) {
			const second = parseInt(parts[1], 10);
			if (!isNaN(second) && second >= 16 && second <= 31) {
				return true;
			}
		}
	}
	if (ipLower.startsWith('192.168.')) {
		return true;
	}

	// Check IPv6 patterns
	if (ipLower.startsWith('fc00:') || ipLower.startsWith('fd00:')) {
		return true;
	}

	return false;
}

/**
 * Helper function to extract a header value (case-insensitive)
 */
function extractHeader(headers: Headers, name: string): string | null {
	const nameLower = name.toLowerCase();
	
	// Try direct lookup first (case-sensitive)
	const value = headers.get(name);
	if (value) {
		const trimmed = value.trim();
		if (trimmed !== '') {
			return trimmed;
		}
	}

	// Fallback: iterate through all headers for case-insensitive match
	for (const [headerName, headerValue] of headers.entries()) {
		if (headerName.toLowerCase() === nameLower) {
			const trimmed = headerValue.trim();
			if (trimmed !== '') {
				return trimmed;
			}
		}
	}

	return null;
}

/**
 * Extracts client IP from Cloudflare CF-Connecting-IP header only
 * 
 * **Note:** This function ONLY uses CF-Connecting-IP header and returns null
 * if it's not present. This ensures we only use Cloudflare's verified client IP.
 */
export function extractClientIp(headers: Headers): string | null {
	return extractHeader(headers, 'cf-connecting-ip');
}

/**
 * Extracts geo location data from Cloudflare headers
 * 
 * Cloudflare provides the following headers (requires "Add visitor location headers" to be enabled):
 * - cf-ipcountry: ISO 3166-1 alpha-2 country code (e.g., "US", "ES", "GB")
 * - cf-ipcity: City name
 * - cf-region: Full region/state name (e.g., "California")
 * 
 * **Note:** When testing on localhost (detected by checking if IP is private/localhost),
 * this function will return "localhost" for all geo fields.
 * 
 * @param headers - Request headers containing Cloudflare geo headers
 * @returns Geo data extracted from Cloudflare headers (returns "localhost" for all fields when IP is localhost)
 */
export function extractCloudflareGeoData(headers: Headers): GeoData {
	// First, check if the IP address is localhost/private
	const clientIp = extractClientIp(headers);
	if (clientIp && isPrivateIp(clientIp)) {
		return {
			country: 'localhost',
			region: 'localhost',
			city: 'localhost'
		};
	}

	// Extract country from cf-ipcountry header
	const country = extractHeader(headers, 'cf-ipcountry');
	// "XX" means unknown country
	const countryFiltered = country && country !== 'XX' ? country : undefined;

	// Extract city from cf-ipcity header
	const city = extractHeader(headers, 'cf-ipcity') || undefined;

	// Extract region from cf-region header (full name)
	const region = extractHeader(headers, 'cf-region') || undefined;

	return {
		country: countryFiltered,
		region,
		city
	};
}

/**
 * Convenience function to extract Cloudflare geo data from a SvelteKit RequestEvent
 */
export function getCloudflareGeoData(event: RequestEvent): GeoData {
	return extractCloudflareGeoData(event.request.headers);
}

/**
 * Extracts Accept-Language header value
 * Returns the primary language preference (first language in the header)
 */
export function extractAcceptLanguage(headers: Headers): string | undefined {
	const acceptLanguage = extractHeader(headers, 'accept-language');
	if (!acceptLanguage) return undefined;
	
	// Extract the first language preference (before comma or semicolon)
	// Example: "en-US,en;q=0.9" -> "en-US"
	return acceptLanguage.split(',')[0].split(';')[0].trim() || undefined;
}

/**
 * Extracts User-Agent header value
 */
export function extractUserAgent(headers: Headers): string | undefined {
	return extractHeader(headers, 'user-agent') || undefined;
}

/**
 * Extracts sec-ch-ua header value (Client Hints User-Agent)
 */
export function extractSecChUa(headers: Headers): string | undefined {
	return extractHeader(headers, 'sec-ch-ua') || undefined;
}

/**
 * Extracts sec-ch-ua-platform header value (Client Hints Platform)
 */
export function extractSecChUaPlatform(headers: Headers): string | undefined {
	return extractHeader(headers, 'sec-ch-ua-platform') || undefined;
}

/**
 * Convenience function to extract all browser headers from a SvelteKit RequestEvent
 */
export interface BrowserHeaders {
	acceptLanguage?: string;
	userAgent?: string;
	secChUa?: string;
	secChUaPlatform?: string;
}

export function getBrowserHeaders(event: RequestEvent): BrowserHeaders {
	const headers = event.request.headers;
	return {
		acceptLanguage: extractAcceptLanguage(headers),
		userAgent: extractUserAgent(headers),
		secChUa: extractSecChUa(headers),
		secChUaPlatform: extractSecChUaPlatform(headers)
	};
}

