export const defaultXAxisFormat = (v: unknown) => {
	const locale = 'en';

	if (v instanceof Date) {
		return v.toLocaleDateString(locale, { month: 'short' });
	}
	return String(v);
};

export const defaultLabelFormatter = (v: unknown) => {
	const locale = 'en';

	if (v instanceof Date) {
		return v.toLocaleDateString(locale, { month: 'long' });
	}
	return String(v);
};
