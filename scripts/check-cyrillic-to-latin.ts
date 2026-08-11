// One runnable check for the Cyrillic→Latin table (ponytail: assert-based self-check).
// Run: bun run scripts/check-cyrillic-to-latin.ts
import { containsCyrillic, toLatin } from '../src/utils/cyrillicToLatin';

const cases: [string, string][] = [
	// Serbian Cyrillic → proper Serbian Latin (diacritics kept: ć, č, ž, š, đ, dž; digraphs Љ/Њ/Џ)
	['Стефана Првовенчаног', 'Stefana Prvovenčanog'],
	['Андрија Јевремовић', 'Andrija Jevremović'],
	['Љиљана Његош Џорџ', 'Ljiljana Njegoš Džordž'],
	['КОПАОНИК', 'KOPAONIK'],
	['Савски Венац', 'Savski Venac'],
	['Златибор 31315, Србија', 'Zlatibor 31315, Srbija'],
	// Lowercase
	['ђ ћ ж џ ш ч љ њ ј ц е', 'đ ć ž dž š č lj nj j c e'],
	// ё/е handling
	['ёлка', 'elka'],
	// Unmapped chars pass through untouched
	['Bulevar Zorana Đinđića 173', 'Bulevar Zorana Đinđića 173'],
	['Knez Mihailova 10', 'Knez Mihailova 10'],
	['123 +JV8P+73', '123 +JV8P+73'],
	['', '']
];

let failed = 0;
for (const [input, expected] of cases) {
	const actual = toLatin(input);
	if (actual !== expected) {
		failed++;
		console.error(`FAIL  toLatin(${JSON.stringify(input)}) = ${JSON.stringify(actual)} — expected ${JSON.stringify(expected)}`);
	}
}
if (containsCyrillic('Knez Mihailova')) {
	failed++;
	console.error('FAIL  containsCyrillic should be false for Latin text');
}
if (!containsCyrillic('Копаоник') || !containsCyrillic('Србија')) {
	failed++;
	console.error('FAIL  containsCyrillic should be true for Cyrillic text');
}
// Invariant: transliterated output is always Cyrillic-free.
for (const [input] of cases) {
	if (containsCyrillic(toLatin(input))) {
		failed++;
		console.error(`FAIL  toLatin(${JSON.stringify(input)}) still contains Cyrillic`);
	}
}

if (failed) {
	console.error(`${failed} check(s) failed`);
	process.exit(1);
}
console.log(`ok — ${cases.length + 3} checks passed`);
