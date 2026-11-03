// Build-time render of a board to HTML, so the page is complete before any script runs.
// Live values (tonight's Moon, the clock) are computed at build time and refreshed in the browser.
import { DOMParser } from 'linkedom';
import { parseBoard, renderTree, toHTML } from './runtime.js';
import emblemTpl from '../../boards/emblem.html?raw';
import emblemCls from '../../boards/emblem.js';

// enough of a browser for renderVals: a desktop-sized window with motion allowed
function fakeWindow() {
  const mq = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  return { innerWidth: 1440, innerHeight: 900, devicePixelRatio: 1, matchMedia: mq, scrollY: 0, addEventListener() {}, removeEventListener() {}, localStorage: { getItem: () => null, setItem() {} } };
}
export function renderBoardHTML(tpl, makeClass) {
  const had = 'window' in globalThis, prev = globalThis.window;
  globalThis.window = fakeWindow();
  try {
    const comps = { Emblem: parseBoard(DOMParser, emblemTpl, emblemCls) };
    const board = parseBoard(DOMParser, tpl, makeClass);
    return toHTML(renderTree(board, {}, comps));
  } finally { if (had) globalThis.window = prev; else delete globalThis.window; }
}
