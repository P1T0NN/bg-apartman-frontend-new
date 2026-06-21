/**
 * Get a date X days from now
 * @param days - Number of days to add (can be negative for past dates)
 */
export function getDaysFromNow(days: number): Date {
	return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

/**
 * Get a date X hours from now
 * @param hours - Number of hours to add (can be negative for past dates)
 */
export function getHoursFromNow(hours: number): Date {
	return new Date(Date.now() + hours * 60 * 60 * 1000);
}

/**
 * Get a date X minutes from now
 * @param minutes - Number of minutes to add (can be negative for past dates)
 */
export function getMinutesFromNow(minutes: number): Date {
	return new Date(Date.now() + minutes * 60 * 1000);
}

/**
 * Get a date X seconds from now
 * @param seconds - Number of seconds to add (can be negative for past dates)
 */
export function getSecondsFromNow(seconds: number): Date {
	return new Date(Date.now() + seconds * 1000);
}

/**
 * Get a date X days from a specific date
 * @param date - Base date
 * @param days - Number of days to add (can be negative for past dates)
 */
export function addDays(date: Date, days: number): Date {
	const result = new Date(date);
	result.setDate(result.getDate() + days);
	return result;
}

/**
 * Get a date X hours from a specific date
 * @param date - Base date
 * @param hours - Number of hours to add (can be negative for past dates)
 */
export function addHours(date: Date, hours: number): Date {
	const result = new Date(date);
	result.setHours(result.getHours() + hours);
	return result;
}

/**
 * Get a date X minutes from a specific date
 * @param date - Base date
 * @param minutes - Number of minutes to add (can be negative for past dates)
 */
export function addMinutes(date: Date, minutes: number): Date {
	const result = new Date(date);
	result.setMinutes(result.getMinutes() + minutes);
	return result;
}

/**
 * Check if a date is in the past
 */
export function isPast(date: Date): boolean {
	return date < new Date();
}

/**
 * Check if a date is in the future
 */
export function isFuture(date: Date): boolean {
	return date > new Date();
}

/**
 * Get the difference in days between two dates
 */
export function getDaysDifference(date1: Date, date2: Date): number {
	const diffTime = Math.abs(date1.getTime() - date2.getTime());
	return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Format a timestamp (epoch number or ISO string) as a locale-formatted
 * date/time. Returns an em-dash for unparseable input so callers can render
 * the result directly without re-checking validity.
 */
export function formatTs(ts: number | string): string {
	const d = new Date(ts);
	return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
}
