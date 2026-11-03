# Porting the prototype to Astro

Source of truth: `../design/prototype/` (canvas Version 137). One item per loop iteration. An item is ticked only when `npm run build` passes and the page matches the prototype at 1440×900 and 375×812, with no horizontal scroll and no console errors.

Preview the prototype: `python3 -m http.server 5190 --directory ../design/prototype`

## Checklist

- [x] **Setup**: Astro project (static output), TypeScript, git, `npm run build`, folder layout, three.js as a dependency · Astro 5.18, three r149 pinned to match the prototype, i18n en/hi, build passes
- [x] **Tokens and base CSS**: `src/styles/tokens.css` from System, shared base CSS (header, pill, line, bead rail, skip link, focus, paper reading light, glossary, starfield fallback) · base.css holds the 26 rules identical on all 11 pages; reading.css is the paper/glossary block verbatim; pill and header pill compute the same as the prototype. Rules that vary by page (.line, .kick, .lede, .body, .bead, phone media) travel with each page
- [x] **Shared layout**: `BaseLayout.astro` with head, fonts, header (solid on scroll, outline pill, language switch, phone menu), footer, Emblem component · header and footer links sit at the same x, y, width and height as the prototype at 1440px; phone menu matches at 375px; English and Hindi strings; routes in src/lib/routes.ts
- [x] **Shared islands**: cursor thread, headings that write themselves, Devanagari `lang` tagging, reading light, glossary popover · checked in the browser: cursor draws on mouse only, headings get data-w/data-in, Devanagari gets lang="sa", glossary opens/closes on Esc and returns focus, Paper toggles and is stored as nv-read. Cursor and lang tags are in BaseLayout; reading and glossary are per page (ReadingSwitch, Term, GlossaryPopover). Manuscripts and Record keep their own heading variant, ported with those pages
- [x] **Shared maths**: `src/lib/astro.ts` (Sun, Moon, nakshatra, tithi, sunrise/sunset, new and full Moon) with unit checks against the prototype's numbers · kept as `astro.js` (verbatim) with `astro.d.ts` types; `npm run test:astro` compares 20,000 values against all 7 page variants, 0 differ
- [x] **Home** (`/`) · live 3D sky ring, thread, tonight, 27 picker and month play, three branches, verse leaf, Devprayag, gifts, journal · all 8 sections at identical offsets and heights at 1440×900 (8400px) and 375×812 (11070px); 3D ring, thread, picker, play, verse tabs and gifts work; no console errors
- [x] **Manuscripts** (`/manuscripts/`) · opening, how to read a leaf, the shelf, register with search and empty state, six stages, adopt · same section offsets as the prototype at both sizes (17915px / 14393px); stepping the page's tick() gives the identical reading-camera transform, shelf offset and active stage; search empty state and the ४६४२ row link work
- [x] **Manuscript record** (`/manuscripts/4642/`) · scan viewer, reading tabs, catalogue, stages, cite, paper default · identical layout to the prototype at both sizes (2906px / 5166px); opens in Paper with the paper header; zoom, reading tabs, glossary and Night switch work; a remembered reading light overrides the default, as designed
- [x] **The 27** (`/nakshatra/`) · nakshatra explorer and its sky · identical section offsets at both sizes (6256px / 7839px); picking a nakshatra, the 3D sky and the Moon's road (star catalogue from public/data, astronomy-engine from public/vendor) work; no console errors
- [x] **Learn** (`/learn/`) · the three instruments (tithi, shadow-stick, kundali) · identical section offsets at both sizes (6102px / 7856px); after driving both sliders and the date field the page text matches the prototype exactly; no console errors (the prototype shows raw-template errors; the site renders at build time so it has none)
- [x] **Our story** (`/our-story/`) · keepers, shadow-stick, 3D journey · identical section offsets at both sizes (7040px / 9033px); 3D valley runs; after moving the shadow-stick the page text matches the prototype exactly; no console errors
- [x] **Visit** (`/visit/`) · at a glance, getting there, ask-to-come form and its states · identical section offsets at both sizes (3887px / 6591px); the form's empty-field errors and sent state read exactly as in the prototype; no 3D and no three.js loaded; no console errors
- [x] **Journal** (`/journal/`) · list, filters · identical section offsets at both sizes (3332px / 5546px); after choosing a filter the list text matches the prototype exactly; no console errors
- [x] **Journal article** (`/journal/sky-guide/`) · Moon that walks the month, reading light, glossary · identical height and heading offsets at both sizes (5252px / 6763px); the computed 30-night text matches the prototype exactly; glossary, Paper/Night and astronomy-engine work; no console errors
- [x] **Support** (`/support/`) · giving flow with errors, payment failed, thank you · identical section offsets at both sizes (2200px / 4419px); walking the flow (empty-field errors → review → simulated payment failure → try again → thank you) reads exactly as in the prototype; no console errors
- [x] **404** (`/404`) · built as dist/404.html (Cloudflare Pages serves it for unknown paths); text, links and height identical to the prototype at both sizes (1209px / 1862px); no console errors
- [x] **Hindi** (`/hi/`) · Hindi Home through Astro i18n routing · `<html lang="hi">`, Hindi header and footer; identical section offsets and page text to the prototype at both sizes (8281px / 10572px); no lang="sa" tagging on the Hindi page; no console errors. Other pages stay English, as in the prototype
- [x] **Content collections**: journal posts, manuscript records, register as Markdown/JSON · `src/content/register.json`, `journal.json`, `records/4642.catalogue.json`, `records/4642.reading.json`, documented in `src/content/README.md`; the extractor now seeds these once and makes the boards read them; Journal, Manuscripts register and the record give identical text to the prototype
- [ ] **Worker stubs**: visit request and Razorpay webhook in `worker/` (no keys)
- [ ] **Visual tests green**: Playwright compares every page with the prototype at both sizes
- [ ] **README**: how to run, build, test, where content lives, what the family still has to supply

## How pages are ported

Each prototype board is split by `scripts/extract-board.py` into `src/boards/<page>.html` (template), `src/boards/<page>.js` (its component logic, verbatim) and `src/styles/pages/<page>.css`. `src/lib/dc/runtime.js` is the prototype's own template runtime: the page is rendered to HTML at build time (`ssr.js`, so it loads complete and is indexable) and the browser then mounts the same component (`boot.js`). Header, footer and cursor are the shared Astro components.

## Notes for checking

- The browser pane in this setup can run in the background, which pauses animation frames. Scroll scenes are then checked by calling the page's own `tick()` through `window.__board` (exposed by `boot.js`), on both the site and the prototype (`window.__dc`).

## Differences

Anything that could not be matched exactly, and why.

- Phone menu: the canvas mounts it on demand; the site renders it once with `hidden` and toggles it (adds Esc to close). Looks and behaves the same.
- Pages with their own root background use the layout's `bare` mode: header and footer sit beside the page root instead of inside it. The header follows the root's Paper light through `body:has(.vroot.paper)`.
- Live values (tonight's Moon, dates) are computed at build time in the HTML and recomputed in the browser on load.
- The Moon's road and the sky guide use astronomy-engine (MIT, Don Cross). The prototype's exact minified browser build ships as `public/vendor/astronomy.browser.min.js`, licence header intact, loaded with `defer` before the page logic. Star and Milky Way catalogues are in `public/data/`.
- Journal dates are stored as `daysAgo` (the prototype computed them relative to today); swap for real dates when posts are written.
- Sky maths: kept as verbatim JavaScript (`src/lib/astro.js` + types) rather than rewritten in TypeScript, so the numbers cannot drift from the prototype.

## Still needed from the family

Carried over from the prototype: visiting hours, 80G/FCRA/registration, gift amounts, family and instrument photos, readings marked "to be confirmed".
