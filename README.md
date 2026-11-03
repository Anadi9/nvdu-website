# Nakshatra Vedshala · website

The production site for the Nakshatra Vedshala, Devprayag: a faithful port of the final "Sutra world" prototype (`../design/prototype/`, canvas Version 137) to a static Astro site for Cloudflare Pages.

## Run it

Needs Node 22 and Python 3 (for the local comparison servers).

```bash
npm install
```

```bash
npm run dev
```

Opens the site at http://localhost:4321 while you edit.

```bash
npm run build
```

Writes the finished site to `dist/`, the folder Cloudflare Pages serves.

## Check it

| Command | What it checks |
|---|---|
| `npm run test:visual` | Every page against its prototype page, at 1440×900 and 375×812: height, section positions, no sideways scroll, no console errors, three screens pixel-compared. Run `npm run build` first. |
| `npm run test:astro` | The sky maths in `src/lib/astro.js` against every prototype page's own copy (20,000 values). |
| `npm run test:worker` | The visit-request and gift Worker in `worker/`, without keys or network. |
| `npm run proto` | Serves the prototype at http://localhost:5190 to compare by eye (e.g. `/HomeSutra.dc.html`). |

## Pages

| Address | Page | Prototype board |
|---|---|---|
| `/` | Home | HomeSutra |
| `/hi/` | Home in Hindi (draft, translation to be checked) | HomeHi |
| `/nakshatra/` | The 27 Nakshatras | Nakshatra |
| `/learn/` | Learn | Learn |
| `/manuscripts/` | Manuscripts | Pothi |
| `/manuscripts/4642/` | Record of folio ४६४२ | PothiRecord |
| `/our-story/` | Our story | Katha |
| `/visit/` | Visit | Visit |
| `/journal/` | Journal | Journal |
| `/journal/sky-guide/` | Sky guide article | JournalPost |
| `/support/` | Support · Tie a thread | Dana |
| `/404.html` | Page not found | NotFound |

The design rulebook (`System.dc.html` in the prototype) is not a public page; its tokens are in `src/styles/tokens.css`.

## How it is built

- **Boards.** Each prototype page is split by `scripts/extract-board.py` into `src/boards/<page>.html` (template), `src/boards/<page>.js` (its logic, verbatim) and `src/styles/pages/<page>.css`. `src/lib/dc/runtime.js` is the prototype's own template runtime: pages are rendered to HTML at build time and the browser then mounts the same logic, so behaviour matches the prototype exactly.
- **Shared parts.** `src/layouts/BaseLayout.astro`, `src/components/` (Header, Footer, Emblem, Cursor, reading-light switch, glossary) and `src/styles/base.css`.
- **Sky.** `src/lib/astro.js` (Sun and Moon for Devprayag), three.js r149 from npm on the pages with a 3D sky, and astronomy-engine (`public/vendor/`) with its star catalogues (`public/data/`) on The 27 and the sky guide.
- **Images** are in `public/img/` under their prototype ids. Move the manuscript scans to Cloudflare R2 when the full-resolution photographs arrive.
- **Worker.** `worker/` holds the `/api/*` routes for visit requests and gifts (Razorpay). Not connected; see `worker/README.md`.

`PORTING.md` records what was checked for every page, and every place the site differs from the prototype and why.

## Editing content

Text the family will change lives in `src/content/` (register rows, journal notes, the folio ४६४२ record); see `src/content/README.md`. To change a page's design, change the prototype first, then re-extract that page:

```bash
python3 scripts/extract-board.py Pothi pothi
```

Then rebuild and run `npm run test:visual`.

## Before launch: what the family still has to supply

Everything below is marked on the pages as a placeholder or "to be confirmed"; none of it was invented.

- **Giving:** registration number, 80G status, FCRA status for gifts from abroad, gift amounts (`[₹ amount]`), a Razorpay account, and the email that receives receipts and visit requests.
- **Visiting:** hours, closed days, whether night viewing is by appointment, best season, access up the hill, and the map pin.
- **Photographs:** the family and the keepers, the 1930 telescope (a museum stand-in is used now), the instruments, and the Vedshala's own Devprayag photographs (stock photos are credited as stand-ins). The ring-text photograph and the signboard need their source confirmed.
- **Manuscripts:** the register's real rows, and for folio ४६४२ its title, branch, size, leaf count, date, the reading in four layers and the note. The readings marked "to be confirmed" (the opening blessing, the margin title गी. टी., the library stamp) need checking.
- **Story:** references for the family history, and when each instrument came to the hill.
- **Journal:** the real notes, their dates and reading times.
- **Hindi:** a check of the Hindi Home's translation.
- **Domain:** `astro.config.mjs` uses `https://nakshatravedshala.org` as a placeholder.
