// One-off: extract BACKEND_MESSAGES from backendMessages.ts into a Paraglide
// msg-part keyed with the "BackendMessages." prefix. Byte-exact copy of the copy.
const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '..', '..', 'src', 'shared', 'features', 'validations', 'data', 'backendMessages.ts');
let src = fs.readFileSync(srcPath, 'utf8');

// Strip full-line comments (safe: no "//" or "*/" occurs inside these values)
src = src.replace(/^\s*\/\/.*$/gm, '');
src = src.replace(/\/\*[\s\S]*?\*\//g, '');

const m = src.match(/export const BACKEND_MESSAGES[\s\S]*?=\s*\{([\s\S]*?)\n\};/);
if (!m) throw new Error('object literal not found');
const body = m[1];
const obj = eval('({' + body + '})');

const out = {};
for (const [k, v] of Object.entries(obj)) out['BackendMessages.' + k] = v;

const outPath = path.join(__dirname, 'backendmessages.json');
fs.writeFileSync(outPath, JSON.stringify(out, null, '\t') + '\n');
console.log('entries:', Object.keys(out).length);
console.log('wrote', outPath);
