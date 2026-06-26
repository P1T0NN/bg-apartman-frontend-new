/** Capitalizes only the first character of a string. Returns the input unchanged when empty. */
export function capitalizeFirst(s: string): string {
	return s.length === 0 ? s : s[0].toUpperCase() + s.slice(1);
}

/** Up to two uppercase initials from a display name (e.g. `"Jane Doe"` → `"JD"`). */
export function initials(name?: string | null): string {
	if (!name?.trim()) return '?';
	return name
		.trim()
		.split(/\s+/)
		.map((part) => part[0])
		.filter(Boolean)
		.slice(0, 2)
		.join('')
		.toUpperCase();
}
