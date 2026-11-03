# Porting the prototype to Astro

Source of truth: `../design/prototype/` (canvas Version 137). One item per loop iteration. An item is ticked only when `npm run build` passes and the page matches the prototype at 1440×900 and 375×812, with no horizontal scroll and no console errors.

Preview the prototype: `python3 -m http.server 5190 --directory ../design/prototype`

## Checklist

- [x] **Setup**: Astro project (static output), TypeScript, git, `npm run build`, folder layout, three.js as a dependency · Astro 5.18, three r149 pinned to match the prototype, i18n en/hi, build passes
- [x] **Tokens and base CSS**: `src/styles/tokens.css` from System, shared base CSS (header, pill, line, bead rail, skip link, focus, paper reading light, glossary, starfield fallback) · base.css holds the 26 rules identical on all 11 pages; reading.css is the paper/glossary block verbatim; pill and header pill compute the same as the prototype. Rules that vary by page (.line, .kick, .lede, .body, .bead, phone media) travel with each page
- [x] **Shared layout**: `BaseLayout.astro` with head, fonts, header (solid on scroll, outline pill, language switch, phone menu), footer, Emblem component · header and footer links sit at the same x, y, width and height as the prototype at 1440px; phone menu matches at 375px; English and Hindi strings; routes in src/lib/routes.ts
- [ ] **Shared islands**: cursor thread, headings that write themselves, Devanagari `lang` tagging, reading light, glossary popover
- [ ] **Shared maths**: `src/lib/astro.ts` (Sun, Moon, nakshatra, tithi, sunrise/sunset, new and full Moon) with unit checks against the prototype's numbers
- [ ] **Home** (`/`) · live 3D sky ring, thread, tonight, 27 picker and month play, three branches, verse leaf, Devprayag, gifts, journal
- [ ] **Manuscripts** (`/manuscripts/`) · opening, how to read a leaf, the shelf, register with search and empty state, six stages, adopt
- [ ] **Manuscript record** (`/manuscripts/4642/`) · scan viewer, reading tabs, catalogue, stages, cite, paper default
- [ ] **The 27** (`/nakshatra/`) · nakshatra explorer and its sky
- [ ] **Learn** (`/learn/`) · the three instruments (tithi, shadow-stick, kundali)
- [ ] **Our story** (`/our-story/`) · keepers, shadow-stick, 3D journey
- [ ] **Visit** (`/visit/`) · at a glance, getting there, ask-to-come form and its states
- [ ] **Journal** (`/journal/`) · list, filters
- [ ] **Journal article** (`/journal/sky-guide/`) · Moon that walks the month, reading light, glossary
- [ ] **Support** (`/support/`) · giving flow with errors, payment failed, thank you
- [ ] **404** (`/404`)
- [ ] **Hindi** (`/hi/`) · Hindi Home through Astro i18n routing
- [ ] **Content collections**: journal posts, manuscript records, register as Markdown/JSON
- [ ] **Worker stubs**: visit request and Razorpay webhook in `worker/` (no keys)
- [ ] **Visual tests green**: Playwright compares every page with the prototype at both sizes
- [ ] **README**: how to run, build, test, where content lives, what the family still has to supply

## Differences

Anything that could not be matched exactly, and why.

- Phone menu: the canvas mounts it on demand; the site renders it once with `hidden` and toggles it (adds Esc to close). Looks and behaves the same.

## Still needed from the family

Carried over from the prototype: visiting hours, 80G/FCRA/registration, gift amounts, family and instrument photos, readings marked "to be confirmed".
