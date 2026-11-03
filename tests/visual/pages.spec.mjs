// Each site page must match its prototype board: same layout, no sideways scroll, no console errors,
// and the first screen (plus a few scrolled screens) pixel-matched within a small tolerance.
// The clock is frozen and motion reduced on both, so live values and animations agree; 3D canvases are masked.
import { test, expect } from '@playwright/test';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import fs from 'node:fs';

const PROTO = 'http://localhost:5190/', SITE = 'http://localhost:5191';
const PAGES = [
  ['HomeSutra', '/'], ['HomeHi', '/hi/'], ['Pothi', '/manuscripts/'], ['PothiRecord', '/manuscripts/4642/'],
  ['Nakshatra', '/nakshatra/'], ['Learn', '/learn/'], ['Katha', '/our-story/'], ['Visit', '/visit/'],
  ['Journal', '/journal/'], ['JournalPost', '/journal/sky-guide/'], ['Dana', '/support/'], ['NotFound', '/404.html'],
];
const SIZES = [['desktop', 1440, 900], ['phone', 375, 812]];
const AT = new Date('2026-11-03T15:30:00Z');          // the same moment on both sides
const TOLERANCE = 0.02;                               // share of pixels allowed to differ (font hinting, star field)

async function open(page, url) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error' && !/\{\{|Failed to load resource/.test(m.text())) errors.push(m.text()); });
  await page.clock.install({ time: AT });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => { try { localStorage.removeItem('nv-read'); } catch (e) {} });
  await page.waitForTimeout(1500);
  return errors;
}
const layout = (page) => page.evaluate(() => ({
  h: document.documentElement.scrollHeight, w: document.documentElement.scrollWidth, vw: innerWidth,
  sections: [...document.querySelectorAll('main section, main article')].map((s) => Math.round(s.getBoundingClientRect().top + scrollY)),
}));
async function shot(page, y) {
  await page.evaluate((y) => window.scrollTo(0, y), y);
  await page.waitForTimeout(400);
  return PNG.sync.read(await page.screenshot({ mask: [page.locator('canvas')], animations: 'disabled', caret: 'hide' }));
}

for (const [board, route] of PAGES) for (const [label, w, h] of SIZES) {
  test(`${route} · ${label}`, async ({ browser }) => {
    const ctxP = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const ctxS = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const p = await ctxP.newPage(), s = await ctxS.newPage();
    await open(p, PROTO + board + '.dc.html');
    const siteErrors = await open(s, SITE + route);
    const lp = await layout(p), ls = await layout(s);
    expect(ls.w, 'no sideways scroll').toBeLessThanOrEqual(ls.vw);
    expect(ls.h, 'page height').toBe(lp.h);
    expect(ls.sections, 'section positions').toEqual(lp.sections);
    expect(siteErrors, 'console errors').toEqual([]);
    for (const y of [0, Math.round(lp.h * 0.33), Math.round(lp.h * 0.66)]) {
      const a = await shot(p, y), b = await shot(s, y);
      const diff = new PNG({ width: a.width, height: a.height });
      const bad = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0.15 });
      const ratio = bad / (a.width * a.height);
      if (ratio > TOLERANCE) {
        fs.mkdirSync('test-results/diff', { recursive: true });
        const base = `test-results/diff/${board}-${label}-${y}`;
        fs.writeFileSync(base + '-proto.png', PNG.sync.write(a)); fs.writeFileSync(base + '-site.png', PNG.sync.write(b)); fs.writeFileSync(base + '-diff.png', PNG.sync.write(diff));
      }
      expect(ratio, `pixels differing at scroll ${y}`).toBeLessThanOrEqual(TOLERANCE);
    }
    await ctxP.close(); await ctxS.close();
  });
}
