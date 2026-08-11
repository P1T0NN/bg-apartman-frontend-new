/**
 * Cyrillic → Latin transliteration (Serbian table, with ё/е handled).
 *
 * Pure TS — safe to import from both the client and Convex (no framework globals).
 * The 4-layer address invariant (see TODO.md §2) uses this so no Cyrillic can survive
 * in location strings: the Maps bootstrap loads `language: 'en'`, the autocomplete
 * search query is transliterated, picked-place values are guarded on write, and the
 * server normalizes before persist. This util is the shared piece behind layers 2–4.
 *
 * Any character not in the table (Latin, digits, punctuation, other scripts) passes
 * through untouched. Multi-char digraphs (Љ→Lj, Њ→Nj, Џ→Dž) map on a per-char loop.
 */

const CYRILLIC_RANGE = /[Ѐ-ӿ]/u;

/** True when the string contains any Cyrillic character. */
export function containsCyrillic(s: string): boolean {
	return CYRILLIC_RANGE.test(s);
}

const UPPER: Record<string, string> = {
	А: 'A',
	Б: 'B',
	В: 'V',
	Г: 'G',
	Д: 'D',
	Ђ: 'Đ',
	Е: 'E',
	Ё: 'E',
	Ж: 'Ž',
	З: 'Z',
	И: 'I',
	Ј: 'J',
	К: 'K',
	Л: 'L',
	Љ: 'Lj',
	М: 'M',
	Н: 'N',
	Њ: 'Nj',
	О: 'O',
	П: 'P',
	Р: 'R',
	С: 'S',
	Т: 'T',
	Ћ: 'Ć',
	У: 'U',
	Ф: 'F',
	Х: 'H',
	Ц: 'C',
	Ч: 'Č',
	Џ: 'Dž',
	Ш: 'Š'
};

const LOWER: Record<string, string> = {
	а: 'a',
	б: 'b',
	в: 'v',
	г: 'g',
	д: 'd',
	ђ: 'đ',
	е: 'e',
	ё: 'e',
	ж: 'ž',
	з: 'z',
	и: 'i',
	ј: 'j',
	к: 'k',
	л: 'l',
	љ: 'lj',
	м: 'm',
	н: 'n',
	њ: 'nj',
	о: 'o',
	п: 'p',
	р: 'r',
	с: 's',
	т: 't',
	ћ: 'ć',
	у: 'u',
	ф: 'f',
	х: 'h',
	ц: 'c',
	ч: 'č',
	џ: 'dž',
	ш: 'š'
};

/**
 * Transliterate every Cyrillic character to its Latin counterpart (e.g.
 * «Стефана Првовенчаног» → «Stefana Prvovencanog»). Unmapped characters are kept as-is.
 */
export function toLatin(s: string): string {
	let out = '';
	for (const ch of s) {
		out += UPPER[ch] ?? LOWER[ch] ?? ch;
	}
	return out;
}
