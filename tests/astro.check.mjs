// Checks src/lib/astro.js against every prototype page's own copy of the sky maths.
// Run: npm run test:astro
import fs from 'node:fs';
import * as A from '../src/lib/astro.js';
const P = ['Nakshatra', 'Learn', 'Katha', 'Visit', 'Journal', 'JournalPost', 'NotFound'];
const T = Array.from({ length: 200 }, (_, i) => Date.UTC(2024, 0, 1) + i * 4.71 * 864e5 + i * 1234567);
let bad = 0, compared = 0;
for (const p of P) {
  const t = fs.readFileSync(new URL(`../../design/prototype/${p}.dc.html`, import.meta.url), 'utf8');
  const i = t.indexOf('  astro_() {'), j = t.indexOf('\n  }\n', i) + 4, s = t.slice(i, j);
  const self = {}; new Function(s.slice(s.indexOf('{') + 1, s.lastIndexOf('}'))).call(self);
  for (const [k, f] of Object.entries(self.A)) {
    if (typeof f !== 'function' || typeof A[k] !== 'function') continue;
    for (const ms of T) {
      let a, b; try { a = JSON.stringify(f(ms)); b = JSON.stringify(A[k](ms)); } catch { continue; }
      compared++; if (a !== b) { bad++; if (bad < 5) console.log('differs', p, k, ms, a, b); }
    }
  }
}
console.log(`${compared} values compared, ${bad} differ`);
process.exit(bad ? 1 : 0);
